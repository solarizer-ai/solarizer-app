
-- 1. Replace cli_deduct_credits with spec version (adds credits_used_this_period tracking)
CREATE OR REPLACE FUNCTION public.cli_deduct_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
) RETURNS JSON AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT credits_remaining INTO v_current_balance
  FROM public.nloc_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'balance', v_current_balance,
      'required', p_amount
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.nloc_credits
  SET credits_remaining = v_new_balance,
      credits_used_this_period = credits_used_this_period + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns
    (user_id, type, amount, balance_after, audit_id, description)
  VALUES
    (p_user_id, 'deduction', -p_amount, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Replace cli_refund_credits with clamped version
CREATE OR REPLACE FUNCTION public.cli_refund_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
) RETURNS JSON AS $$
DECLARE
  v_current_used NUMERIC;
  v_current_balance NUMERIC;
  v_actual_refund NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT credits_used_this_period, credits_remaining
  INTO v_current_used, v_current_balance
  FROM public.nloc_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_used IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record');
  END IF;

  -- Clamp refund to prevent credits_used_this_period going negative
  v_actual_refund := LEAST(p_amount, v_current_used);

  IF v_actual_refund <= 0 THEN
    RETURN json_build_object('success', true, 'balance', v_current_balance, 'refunded', 0);
  END IF;

  v_new_balance := v_current_balance + v_actual_refund;

  UPDATE public.nloc_credits
  SET credits_remaining = v_new_balance,
      credits_used_this_period = GREATEST(credits_used_this_period - v_actual_refund, 0),
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns
    (user_id, type, amount, balance_after, audit_id, description)
  VALUES
    (p_user_id, 'refund', v_actual_refund, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance, 'refunded', v_actual_refund);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update auto_settle_stale_sessions to use full refund
CREATE OR REPLACE FUNCTION public.auto_settle_stale_sessions()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, user_id, credits_deducted
    FROM public.audits
    WHERE status = 'analyzing'
      AND credits_deducted > 0
      AND is_locked = false
      AND (
        (last_heartbeat IS NOT NULL AND last_heartbeat < now() - interval '12 hours')
        OR
        (last_heartbeat IS NULL AND created_at < now() - interval '12 hours')
      )
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Full refund under deduct-upfront model
    PERFORM public.cli_refund_credits(
      r.user_id, r.credits_deducted, r.id,
      'Auto-settle: full refund for stale session'
    );

    UPDATE public.audits
    SET status = 'failed',
        is_locked = true,
        credits_deducted = 0,
        error_message = 'Auto-settled: session stale (no heartbeat)',
        updated_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Data migration: return reserved credits to users
UPDATE public.nloc_credits
SET credits_remaining = credits_remaining + credits_reserved,
    credits_reserved = 0,
    updated_at = now()
WHERE credits_reserved > 0;

-- 5. Mark in-flight audits with reserved credits as failed
UPDATE public.audits
SET status = 'failed',
    is_locked = true,
    credits_reserved = 0,
    error_message = 'Migration: credit model simplified',
    updated_at = now()
WHERE status = 'analyzing'
  AND credits_reserved > 0;

-- 6. Drop old RPCs
DROP FUNCTION IF EXISTS public.cli_reserve_credits(UUID, NUMERIC, UUID, TEXT);
DROP FUNCTION IF EXISTS public.cli_commit_credits(UUID, NUMERIC, UUID, TEXT);
DROP FUNCTION IF EXISTS public.cli_release_credits(UUID, NUMERIC, UUID, TEXT);
