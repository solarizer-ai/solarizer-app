-- Phase 1: Database Schema Updates for Cashfree Subscriptions API Integration

-- 1.1 Extend subscriptions table with new columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS cf_subscription_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cf_plan_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_plan subscription_plan DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_plan_effective_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method_saved BOOLEAN DEFAULT FALSE;

-- Add index for cf_subscription_id lookups (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_cf_subscription_id ON subscriptions(cf_subscription_id);

-- 1.2 Create cf_subscription_events table for webhook tracking and idempotency
CREATE TABLE IF NOT EXISTS cf_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cf_subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  cf_payment_id TEXT,
  amount_inr INTEGER,
  status TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for event lookups
CREATE INDEX IF NOT EXISTS idx_cf_subscription_events_cf_subscription_id ON cf_subscription_events(cf_subscription_id);
CREATE INDEX IF NOT EXISTS idx_cf_subscription_events_cf_payment_id ON cf_subscription_events(cf_payment_id);

-- Enable RLS on cf_subscription_events (admin-only access via service role)
ALTER TABLE cf_subscription_events ENABLE ROW LEVEL SECURITY;

-- No user-facing policies - only service role can access this table

-- 1.3 Create activate_subscription RPC (called when SUBSCRIPTION_ACTIVATED webhook received)
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id UUID,
  p_cf_subscription_id TEXT,
  p_cf_plan_id TEXT,
  p_billing_period TEXT DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions SET
    cf_subscription_id = p_cf_subscription_id,
    cf_plan_id = p_cf_plan_id,
    billing_period = p_billing_period,
    payment_method_saved = TRUE,
    status = 'active',
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cf_subscription_id', p_cf_subscription_id
  );
END;
$$;

-- 1.4 Create schedule_downgrade RPC (user schedules downgrade for end of period)
CREATE OR REPLACE FUNCTION public.schedule_downgrade(p_target_plan TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_period_end TIMESTAMPTZ;
  v_current_plan TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current subscription details
  SELECT current_period_end, plan::text INTO v_period_end, v_current_plan
  FROM subscriptions WHERE user_id = v_user_id;
  
  IF v_period_end IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found');
  END IF;
  
  -- Validate downgrade (target must be lower tier)
  IF (v_current_plan = 'starter') OR
     (v_current_plan = 'pro' AND p_target_plan NOT IN ('starter', 'launch')) OR
     (v_current_plan = 'business' AND p_target_plan NOT IN ('starter', 'launch', 'pro')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid downgrade target');
  END IF;
  
  UPDATE subscriptions SET
    pending_plan = p_target_plan::subscription_plan,
    pending_plan_effective_date = v_period_end,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'effective_date', v_period_end,
    'target_plan', p_target_plan,
    'current_plan', v_current_plan
  );
END;
$$;

-- 1.5 Create cancel_pending_downgrade RPC (user cancels scheduled downgrade)
CREATE OR REPLACE FUNCTION public.cancel_pending_downgrade()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  UPDATE subscriptions SET
    pending_plan = NULL,
    pending_plan_effective_date = NULL,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 1.6 Create cancel_subscription RPC (user requests cancellation at period end)
CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_cf_sub_id TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT cf_subscription_id, current_period_end INTO v_cf_sub_id, v_period_end
  FROM subscriptions WHERE user_id = v_user_id;
  
  UPDATE subscriptions SET
    cancel_at_period_end = TRUE,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cf_subscription_id', v_cf_sub_id,
    'access_until', v_period_end
  );
END;
$$;

-- 1.7 Create reactivate_subscription RPC (user cancels their cancellation request)
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  UPDATE subscriptions SET
    cancel_at_period_end = FALSE,
    updated_at = now()
  WHERE user_id = v_user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 1.8 Create process_subscription_renewal RPC (called by webhook on SUBSCRIPTION_CHARGED)
CREATE OR REPLACE FUNCTION public.process_subscription_renewal(
  p_cf_subscription_id TEXT,
  p_cf_payment_id TEXT,
  p_amount_inr INTEGER DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_credits_to_add INTEGER;
  v_old_credits INTEGER;
  v_new_credits INTEGER;
  v_old_rate INTEGER;
  v_new_rate INTEGER;
BEGIN
  -- Lock subscription row for update
  SELECT * INTO v_sub FROM subscriptions
  WHERE cf_subscription_id = p_cf_subscription_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Subscription not found');
  END IF;
  
  -- Check for idempotency - if already processed this payment
  IF EXISTS (
    SELECT 1 FROM cf_subscription_events 
    WHERE cf_payment_id = p_cf_payment_id AND event_type = 'SUBSCRIPTION_CHARGED'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;
  
  -- Log the event
  INSERT INTO cf_subscription_events (cf_subscription_id, event_type, cf_payment_id, amount_inr, status)
  VALUES (p_cf_subscription_id, 'SUBSCRIPTION_CHARGED', p_cf_payment_id, p_amount_inr, 'processed');
  
  -- Handle cancellation at period end
  IF v_sub.cancel_at_period_end THEN
    UPDATE subscriptions SET 
      status = 'canceled',
      updated_at = now()
    WHERE id = v_sub.id;
    
    RETURN jsonb_build_object('success', true, 'cancelled', true);
  END IF;
  
  -- Handle pending downgrade
  IF v_sub.pending_plan IS NOT NULL THEN
    -- Get current credits
    SELECT credits_remaining INTO v_old_credits FROM nloc_credits WHERE user_id = v_sub.user_id;
    
    -- Calculate credit conversion (Fair Usage Policy)
    -- Rates: starter/launch = 700, pro = 600, business = 500 (cents per credit)
    v_old_rate := CASE v_sub.plan::text
      WHEN 'business' THEN 500
      WHEN 'pro' THEN 600
      ELSE 700
    END;
    v_new_rate := CASE v_sub.pending_plan::text
      WHEN 'business' THEN 500
      WHEN 'pro' THEN 600
      ELSE 700
    END;
    v_new_credits := FLOOR((v_old_credits * v_old_rate) / v_new_rate);
    
    -- Apply downgrade
    UPDATE subscriptions SET
      plan = v_sub.pending_plan,
      pending_plan = NULL,
      pending_plan_effective_date = NULL,
      current_period_start = now(),
      current_period_end = CASE 
        WHEN v_sub.billing_period = 'annual' THEN now() + interval '1 year'
        ELSE now() + interval '1 month'
      END,
      updated_at = now()
    WHERE id = v_sub.id;
    
    -- Update credits with conversion
    UPDATE nloc_credits SET
      credits_remaining = v_new_credits,
      updated_at = now()
    WHERE user_id = v_sub.user_id;
    
    -- Log to subscription history
    INSERT INTO subscription_history (user_id, previous_plan, new_plan)
    VALUES (v_sub.user_id, v_sub.plan, v_sub.pending_plan);
    
    RETURN jsonb_build_object(
      'success', true,
      'downgrade_applied', true,
      'new_plan', v_sub.pending_plan::text,
      'old_credits', v_old_credits,
      'new_credits', v_new_credits
    );
  END IF;
  
  -- Normal renewal - add credits
  v_credits_to_add := CASE
    WHEN v_sub.billing_period = 'annual' AND v_sub.plan IN ('pro', 'business') THEN 500
    ELSE 50
  END;
  
  UPDATE nloc_credits SET
    credits_remaining = credits_remaining + v_credits_to_add,
    credits_used_this_period = 0,  -- Reset usage for new period
    period_reset_at = now(),
    updated_at = now()
  WHERE user_id = v_sub.user_id;
  
  -- Extend subscription period
  UPDATE subscriptions SET
    current_period_start = now(),
    current_period_end = CASE
      WHEN v_sub.billing_period = 'annual' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    updated_at = now()
  WHERE id = v_sub.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_added', v_credits_to_add,
    'plan', v_sub.plan::text
  );
END;
$$;

-- 1.9 Create process_upgrade_success RPC (called after upgrade payment succeeds)
CREATE OR REPLACE FUNCTION public.process_upgrade_success(
  p_user_id UUID,
  p_new_plan TEXT,
  p_new_cf_subscription_id TEXT,
  p_new_cf_plan_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_plan TEXT;
BEGIN
  -- Get old plan for history
  SELECT plan::text INTO v_old_plan FROM subscriptions WHERE user_id = p_user_id;
  
  -- Update subscription to new plan (keeping same billing cycle end)
  UPDATE subscriptions SET
    plan = p_new_plan::subscription_plan,
    cf_subscription_id = p_new_cf_subscription_id,
    cf_plan_id = p_new_cf_plan_id,
    pending_plan = NULL,
    pending_plan_effective_date = NULL,
    cancel_at_period_end = FALSE,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log to history
  INSERT INTO subscription_history (user_id, previous_plan, new_plan)
  VALUES (p_user_id, v_old_plan::subscription_plan, p_new_plan::subscription_plan);
  
  RETURN jsonb_build_object(
    'success', true,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan
  );
END;
$$;

-- 1.10 Create handle_subscription_payment_failed RPC
CREATE OR REPLACE FUNCTION public.handle_subscription_payment_failed(
  p_cf_subscription_id TEXT,
  p_cf_payment_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the event
  INSERT INTO cf_subscription_events (cf_subscription_id, event_type, cf_payment_id, status)
  VALUES (p_cf_subscription_id, 'SUBSCRIPTION_PAYMENT_FAILED', p_cf_payment_id, 'failed');
  
  -- Mark subscription as past_due
  UPDATE subscriptions SET
    status = 'past_due',
    updated_at = now()
  WHERE cf_subscription_id = p_cf_subscription_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;