-- Create payment_orders table for tracking all payment attempts
CREATE TABLE public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL CHECK (order_type IN ('subscription', 'power_up')),
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'expired')),
  plan TEXT,
  billing_period TEXT,
  credits_amount INTEGER,
  payment_session_id TEXT,
  cf_payment_id TEXT,
  processed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX idx_payment_orders_user_status ON public.payment_orders(user_id, status);

-- Enable RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.payment_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Deny direct insert/update/delete (only via RPC)
CREATE POLICY "Deny direct insert to payment_orders"
ON public.payment_orders
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct update to payment_orders"
ON public.payment_orders
FOR UPDATE
USING (false);

CREATE POLICY "Deny direct delete from payment_orders"
ON public.payment_orders
FOR DELETE
USING (false);

-- Create atomic payment processing function with idempotency
CREATE OR REPLACE FUNCTION public.process_payment_success(
  p_order_id TEXT,
  p_cf_payment_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order payment_orders%ROWTYPE;
  v_credits_to_add INTEGER;
  v_result jsonb;
BEGIN
  -- Lock the order row to prevent concurrent processing (idempotency)
  SELECT * INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- IDEMPOTENCY CHECK: Skip if already processed
  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true, 
      'already_processed', true,
      'message', 'Order already processed'
    );
  END IF;
  
  -- Mark order as processing (prevents race conditions)
  UPDATE payment_orders
  SET status = 'processing', updated_at = now()
  WHERE order_id = p_order_id;
  
  -- Determine credits based on order type
  IF v_order.order_type = 'subscription' THEN
    -- Subscription: 50 for monthly, 500 for annual Pro/Business
    IF v_order.billing_period = 'annual' AND v_order.plan IN ('pro', 'business') THEN
      v_credits_to_add := 500;
    ELSE
      v_credits_to_add := 50;
    END IF;
    
    -- Update subscription
    UPDATE subscriptions
    SET 
      plan = v_order.plan::subscription_plan,
      status = 'active',
      current_period_start = now(),
      current_period_end = CASE 
        WHEN v_order.billing_period = 'annual' THEN now() + interval '1 year'
        ELSE now() + interval '1 month'
      END,
      updated_at = now()
    WHERE user_id = v_order.user_id;
    
  ELSIF v_order.order_type = 'power_up' THEN
    -- Power-up: Use credits_amount from order
    v_credits_to_add := v_order.credits_amount;
    
    -- Record power-up purchase
    INSERT INTO power_up_purchases (user_id, nloc_amount, price_cents)
    VALUES (v_order.user_id, v_order.credits_amount, v_order.amount_cents);
  END IF;
  
  -- Add credits atomically
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + v_credits_to_add,
    updated_at = now()
  WHERE user_id = v_order.user_id;
  
  -- Mark order as paid with timestamp
  UPDATE payment_orders
  SET 
    status = 'paid',
    cf_payment_id = p_cf_payment_id,
    processed_at = now(),
    updated_at = now()
  WHERE order_id = p_order_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'credits_added', v_credits_to_add,
    'order_type', v_order.order_type,
    'plan', v_order.plan
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Create function to insert payment order (called from edge function with service role)
CREATE OR REPLACE FUNCTION public.create_payment_order(
  p_user_id UUID,
  p_order_id TEXT,
  p_order_type TEXT,
  p_amount_cents INTEGER,
  p_payment_session_id TEXT,
  p_plan TEXT DEFAULT NULL,
  p_billing_period TEXT DEFAULT NULL,
  p_credits_amount INTEGER DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO payment_orders (
    user_id, order_id, order_type, amount_cents, 
    payment_session_id, plan, billing_period, credits_amount
  )
  VALUES (
    p_user_id, p_order_id, p_order_type, p_amount_cents,
    p_payment_session_id, p_plan, p_billing_period, p_credits_amount
  )
  RETURNING jsonb_build_object(
    'success', true,
    'order_id', order_id,
    'id', id
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to mark order as failed
CREATE OR REPLACE FUNCTION public.mark_payment_failed(p_order_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE payment_orders
  SET status = 'failed', updated_at = now()
  WHERE order_id = p_order_id AND status NOT IN ('paid', 'failed');
  
  RETURN jsonb_build_object('success', true);
END;
$$;