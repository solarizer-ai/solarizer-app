
-- Step 1: Add credits_reserved to nloc_credits
ALTER TABLE public.nloc_credits
  ADD COLUMN credits_reserved NUMERIC(12,2) NOT NULL DEFAULT 0
  CONSTRAINT credits_reserved_non_negative CHECK (credits_reserved >= 0);

-- Step 2: Add credits_reserved and last_heartbeat to audits
ALTER TABLE public.audits
  ADD COLUMN credits_reserved NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN last_heartbeat TIMESTAMPTZ;

-- Step 3: cli_reserve_credits RPC
CREATE OR REPLACE FUNCTION public.cli_reserve_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_new_reserved NUMERIC;
BEGIN
  SELECT credits_remaining, credits_reserved INTO v_current_balance, v_new_reserved
  FROM public.nloc_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found');
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
  v_new_reserved := v_new_reserved + p_amount;

  UPDATE public.nloc_credits
  SET credits_remaining = v_new_balance,
      credits_reserved = v_new_reserved,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (p_user_id, 'reservation', -p_amount, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$function$;

-- Step 4: cli_commit_credits RPC
CREATE OR REPLACE FUNCTION public.cli_commit_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_reserved NUMERIC;
  v_new_reserved NUMERIC;
  v_balance NUMERIC;
BEGIN
  SELECT credits_reserved, credits_remaining INTO v_current_reserved, v_balance
  FROM public.nloc_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_reserved IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found');
  END IF;

  IF v_current_reserved < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient reserved credits',
      'reserved', v_current_reserved, 'requested', p_amount);
  END IF;

  v_new_reserved := v_current_reserved - p_amount;

  UPDATE public.nloc_credits
  SET credits_reserved = v_new_reserved,
      credits_used_this_period = credits_used_this_period + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (p_user_id, 'commit', -p_amount, v_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_balance, 'reserved', v_new_reserved);
END;
$function$;

-- Step 5: cli_release_credits RPC
CREATE OR REPLACE FUNCTION public.cli_release_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_audit_id UUID,
  p_description TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_reserved NUMERIC;
  v_new_reserved NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT credits_reserved, credits_remaining INTO v_current_reserved, v_new_balance
  FROM public.nloc_credits WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_reserved IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No credit record found');
  END IF;

  -- Clamp release to what's actually reserved
  IF p_amount > v_current_reserved THEN
    p_amount := v_current_reserved;
  END IF;

  v_new_reserved := v_current_reserved - p_amount;
  v_new_balance := v_new_balance + p_amount;

  UPDATE public.nloc_credits
  SET credits_reserved = v_new_reserved,
      credits_remaining = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_txns (user_id, type, amount, balance_after, audit_id, description)
  VALUES (p_user_id, 'release', p_amount, v_new_balance, p_audit_id, p_description);

  RETURN json_build_object('success', true, 'balance', v_new_balance, 'reserved', v_new_reserved);
END;
$function$;

-- Step 6: auto_settle_stale_sessions
CREATE OR REPLACE FUNCTION public.auto_settle_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_commit_amount NUMERIC;
  v_release_amount NUMERIC;
  v_ratio NUMERIC;
BEGIN
  FOR r IN
    SELECT id, user_id, credits_reserved, contracts_completed, contracts_total
    FROM public.audits
    WHERE status = 'analyzing'
      AND is_locked = false
      AND credits_reserved > 0
      AND last_heartbeat < now() - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Calculate proportional commit
    IF r.contracts_total > 0 AND r.contracts_completed > 0 THEN
      v_ratio := r.contracts_completed::NUMERIC / r.contracts_total::NUMERIC;
      v_commit_amount := ROUND(r.credits_reserved * v_ratio, 2);
    ELSE
      v_commit_amount := 0;
    END IF;
    v_release_amount := r.credits_reserved - v_commit_amount;

    -- Commit earned portion
    IF v_commit_amount > 0 THEN
      PERFORM public.cli_commit_credits(
        r.user_id, v_commit_amount, r.id,
        'Auto-settle: ' || COALESCE(r.contracts_completed, 0) || '/' || COALESCE(r.contracts_total, 0) || ' contracts'
      );
    END IF;

    -- Release remainder
    IF v_release_amount > 0 THEN
      PERFORM public.cli_release_credits(
        r.user_id, v_release_amount, r.id,
        'Auto-settle release: stale session'
      );
    END IF;

    -- Lock the audit to prevent re-processing
    UPDATE public.audits
    SET status = 'failed',
        is_locked = true,
        credits_reserved = 0,
        error_message = 'Auto-settled: no heartbeat for 12+ hours',
        updated_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$function$;
