
-- 1. Update handle_new_user() to NOT create subscription or credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- NO subscription row created
  -- NO nloc_credits row created
  -- User must subscribe to a plan before using the platform
  
  RETURN NEW;
END;
$function$;

-- 2. Replace initialize_user_credits with a no-op (drop trigger, keep function harmless)
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;

CREATE OR REPLACE FUNCTION public.initialize_user_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- No-op: credits are now provisioned only when a subscription is purchased
  RETURN NEW;
END;
$function$;

-- 3. Update purchase_subscription to use upserts instead of updates
CREATE OR REPLACE FUNCTION public.purchase_subscription(p_plan text, p_billing_period text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_credits_to_add INTEGER;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate plan
  IF p_plan NOT IN ('starter', 'pro', 'business') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid plan');
  END IF;
  
  -- Validate billing period
  IF p_billing_period NOT IN ('monthly', 'annual') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid billing period');
  END IF;
  
  -- 50 credits for monthly, 500 for annual Pro/Business
  IF p_billing_period = 'annual' AND p_plan IN ('pro', 'business') THEN
    v_credits_to_add := 500;
  ELSE
    v_credits_to_add := 50;
  END IF;
  
  -- Upsert subscription (handles first-time and existing)
  INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end, updated_at)
  VALUES (
    v_user_id,
    p_plan::subscription_plan,
    'active',
    now(),
    CASE 
      WHEN p_billing_period = 'annual' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = p_plan::subscription_plan,
    status = 'active',
    current_period_start = now(),
    current_period_end = CASE 
      WHEN p_billing_period = 'annual' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    updated_at = now();
  
  -- Upsert credits (handles first-time and existing)
  INSERT INTO nloc_credits (user_id, credits_remaining, credits_used_this_period, updated_at)
  VALUES (v_user_id, v_credits_to_add, 0, now())
  ON CONFLICT (user_id) DO UPDATE SET
    credits_remaining = nloc_credits.credits_remaining + v_credits_to_add,
    updated_at = now()
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_added', v_credits_to_add,
    'plan', p_plan,
    'billing_period', p_billing_period
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to provision credits');
  END IF;
  
  RETURN v_result;
END;
$function$;

-- 4. Update process_payment_success to handle first-time subscription (upsert)
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
    IF v_order.billing_period = 'annual' AND v_order.plan IN ('pro', 'business') THEN
      v_credits_to_add := 500;
    ELSE
      v_credits_to_add := 50;
    END IF;
    
    -- Upsert subscription for first-time purchase
    INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end, updated_at)
    VALUES (
      v_order.user_id,
      v_order.plan::subscription_plan,
      'active',
      now(),
      CASE 
        WHEN v_order.billing_period = 'annual' THEN now() + interval '1 year'
        ELSE now() + interval '1 month'
      END,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan = v_order.plan::subscription_plan,
      status = 'active',
      current_period_start = now(),
      current_period_end = CASE 
        WHEN v_order.billing_period = 'annual' THEN now() + interval '1 year'
        ELSE now() + interval '1 month'
      END,
      updated_at = now();
    
  ELSIF v_order.order_type = 'power_up' THEN
    v_credits_to_add := v_order.credits_amount;
    
    INSERT INTO power_up_purchases (user_id, nloc_amount, price_cents)
    VALUES (v_order.user_id, v_order.credits_amount, v_order.amount_cents);

  ELSIF v_order.order_type = 'upgrade' THEN
    -- Upgrades don't add credits; plan change is handled by the verify-payment edge function
    v_credits_to_add := 0;
  END IF;
  
  -- Only update credits if there are credits to add (upsert for first-time)
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
