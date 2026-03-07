CREATE OR REPLACE FUNCTION public.process_payment_success(p_order_id text, p_cf_payment_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order payment_orders%ROWTYPE;
  v_credits_to_add INTEGER := 0;
  v_result jsonb;
BEGIN
  SELECT * INTO v_order
  FROM payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF v_order.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', true, 
      'already_processed', true,
      'message', 'Order already processed'
    );
  END IF;
  
  UPDATE payment_orders
  SET status = 'processing', updated_at = now()
  WHERE order_id = p_order_id;
  
  IF v_order.order_type = 'subscription' THEN
    -- All plans now grant 500 credits (single Inferno tier)
    v_credits_to_add := 500;
    
    INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end, updated_at)
    VALUES (
      v_order.user_id,
      v_order.plan::subscription_plan,
      'active',
      now(),
      now() + interval '1 month',
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan = v_order.plan::subscription_plan,
      status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '1 month',
      updated_at = now();
    
  ELSIF v_order.order_type = 'power_up' THEN
    v_credits_to_add := v_order.credits_amount;
    
    INSERT INTO power_up_purchases (user_id, nloc_amount, price_cents)
    VALUES (v_order.user_id, v_order.credits_amount, v_order.amount_cents);

  ELSIF v_order.order_type = 'upgrade' THEN
    v_credits_to_add := 0;
  END IF;
  
  IF v_credits_to_add > 0 THEN
    INSERT INTO nloc_credits (user_id, credits_remaining, credits_used_this_period, updated_at)
    VALUES (v_order.user_id, v_credits_to_add, 0, now())
    ON CONFLICT (user_id) DO UPDATE SET
      credits_remaining = nloc_credits.credits_remaining + v_credits_to_add,
      updated_at = now();
  END IF;
  
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
$function$;