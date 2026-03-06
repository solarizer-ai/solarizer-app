-- Migration 3: Update handle_new_user() to provision nloc_credits with 0 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Provision empty credit record (no free credits on signup)
  INSERT INTO public.nloc_credits (user_id, credits_remaining, scans_remaining)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Migration 4: Guard deduct_credits against expired trials
CREATE OR REPLACE FUNCTION public.deduct_credits(p_nloc_amount integer, p_is_starter boolean DEFAULT false, p_audit_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_new_balance INTEGER;
  v_result jsonb;
  v_sub RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check for expired trial
  SELECT plan, current_period_end INTO v_sub
  FROM subscriptions
  WHERE user_id = v_user_id AND status = 'active';

  IF v_sub.plan = 'trial' AND v_sub.current_period_end < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial expired');
  END IF;
  
  SELECT credits_remaining INTO v_current_credits
  FROM nloc_credits 
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit record found');
  END IF;
  
  IF v_current_credits < p_nloc_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'credits_remaining', v_current_credits,
      'required', p_nloc_amount
    );
  END IF;
  
  v_new_balance := v_current_credits - p_nloc_amount;
  
  UPDATE nloc_credits
  SET 
    credits_remaining = v_new_balance,
    credits_used_this_period = credits_used_this_period + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (v_user_id, 'deduction', -p_nloc_amount, v_new_balance, p_audit_id, 
          COALESCE(p_description, 'Web audit deduction'));

  v_result := jsonb_build_object(
    'success', true,
    'credits_remaining', v_new_balance,
    'credits_used_this_period', (SELECT credits_used_this_period FROM nloc_credits WHERE user_id = v_user_id)
  );
  
  RETURN v_result;
END;
$function$;

-- Also update the simpler overload
CREATE OR REPLACE FUNCTION public.deduct_credits(p_nloc_amount integer, p_is_starter boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_result jsonb;
  v_sub RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check for expired trial
  SELECT plan, current_period_end INTO v_sub
  FROM subscriptions
  WHERE user_id = v_user_id AND status = 'active';

  IF v_sub.plan = 'trial' AND v_sub.current_period_end < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial expired');
  END IF;
  
  SELECT credits_remaining INTO v_current_credits
  FROM nloc_credits 
  WHERE user_id = v_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credit record found');
  END IF;
  
  IF v_current_credits < p_nloc_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient credits',
      'credits_remaining', v_current_credits,
      'required', p_nloc_amount
    );
  END IF;
  
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining - p_nloc_amount,
    credits_used_this_period = credits_used_this_period + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'credits_used_this_period', credits_used_this_period
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$;

-- Migration 5: Guard purchase_power_up against trial users
CREATE OR REPLACE FUNCTION public.purchase_power_up(p_nloc_amount integer, p_price_cents integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_result jsonb;
  v_plan TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if trial user
  SELECT plan::text INTO v_plan
  FROM subscriptions
  WHERE user_id = v_user_id AND status = 'active';

  IF v_plan = 'trial' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial users cannot purchase credits');
  END IF;
  
  IF p_nloc_amount <= 0 OR p_price_cents <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;
  
  INSERT INTO power_up_purchases (user_id, nloc_amount, price_cents)
  VALUES (v_user_id, p_nloc_amount, p_price_cents);
  
  UPDATE nloc_credits
  SET 
    credits_remaining = credits_remaining + p_nloc_amount,
    updated_at = now()
  WHERE user_id = v_user_id
  RETURNING jsonb_build_object(
    'success', true,
    'credits_remaining', credits_remaining,
    'nloc_added', p_nloc_amount
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credit record not found');
  END IF;
  
  RETURN v_result;
END;
$function$;

-- Migration 6: Update validate_access_token to return token_type
CREATE OR REPLACE FUNCTION public.validate_access_token(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_token RECORD;
BEGIN
  SELECT * INTO v_token
  FROM public.access_tokens
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid access token');
  END IF;

  IF NOT v_token.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has been deactivated');
  END IF;

  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has expired');
  END IF;

  IF v_token.max_uses IS NOT NULL AND v_token.used_count >= v_token.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This access token has been fully redeemed');
  END IF;

  RETURN jsonb_build_object('valid', true, 'token_id', v_token.id, 'token_type', v_token.token_type);
END;
$function$;

-- Migration 7: Update process_payment_success with scaled credit grants
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
    -- Scaled credit grants per plan
    IF v_order.billing_period = 'annual' AND v_order.plan IN ('pro', 'business') THEN
      v_credits_to_add := 500;
    ELSE
      -- Monthly grants: starter=50, pro=100, business=200
      CASE v_order.plan
        WHEN 'starter' THEN v_credits_to_add := 50;
        WHEN 'pro' THEN v_credits_to_add := 100;
        WHEN 'business' THEN v_credits_to_add := 200;
        ELSE v_credits_to_add := 50;
      END CASE;
    END IF;
    
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