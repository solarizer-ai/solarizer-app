-- Migration 2: Create activate_trial RPC
CREATE OR REPLACE FUNCTION public.activate_trial(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_token RECORD;
  v_already_trialed TIMESTAMPTZ;
  v_active_sub RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already trialed
  SELECT trial_activated_at INTO v_already_trialed
  FROM profiles WHERE user_id = v_user_id;

  IF v_already_trialed IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used a free trial');
  END IF;

  -- Check if user has an active subscription
  SELECT id, plan INTO v_active_sub
  FROM subscriptions
  WHERE user_id = v_user_id AND status = 'active';

  IF v_active_sub.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have an active subscription');
  END IF;

  -- Validate the trial token
  SELECT * INTO v_token
  FROM access_tokens
  WHERE code = UPPER(TRIM(p_code))
    AND token_type = 'trial'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR used_count < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired trial code');
  END IF;

  -- Check if user already redeemed this token
  IF EXISTS (
    SELECT 1 FROM access_token_redemptions
    WHERE token_id = v_token.id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this trial code');
  END IF;

  -- Upsert subscription as trial (14 days)
  INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end, updated_at)
  VALUES (v_user_id, 'trial', 'active', now(), now() + interval '14 days', now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'trial',
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '14 days',
    updated_at = now();

  -- Upsert credits to 300
  INSERT INTO nloc_credits (user_id, credits_remaining, credits_used_this_period, updated_at)
  VALUES (v_user_id, 300, 0, now())
  ON CONFLICT (user_id) DO UPDATE SET
    credits_remaining = 300,
    credits_used_this_period = 0,
    updated_at = now();

  -- Record credit grant in ledger
  INSERT INTO credit_txns (user_id, type, amount, balance_after, description)
  VALUES (v_user_id, 'subscription_grant', 300, 300, 'Trial activation: 300 credits');

  -- Record redemption
  INSERT INTO access_token_redemptions (token_id, user_id)
  VALUES (v_token.id, v_user_id);

  -- Increment used count
  UPDATE access_tokens SET used_count = used_count + 1 WHERE id = v_token.id;

  -- Set trial_activated_at
  UPDATE profiles SET trial_activated_at = now(), updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;