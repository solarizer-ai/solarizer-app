
-- Fix 1: Expand credit_txns CHECK constraint
ALTER TABLE public.credit_txns
  DROP CONSTRAINT credit_txns_type_check;

ALTER TABLE public.credit_txns
  ADD CONSTRAINT credit_txns_type_check
  CHECK (type IN (
    'subscription_grant', 'purchase', 'deduction', 'refund',
    'reservation', 'commit', 'release'
  ));

-- Fix 2: Handle NULL heartbeat in auto_settle_stale_sessions
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
    SELECT id, user_id, credits_reserved, contracts_completed, contracts_total, created_at
    FROM public.audits
    WHERE status = 'analyzing'
      AND is_locked = false
      AND credits_reserved > 0
      AND (last_heartbeat < now() - interval '12 hours'
           OR (last_heartbeat IS NULL
               AND created_at < now() - interval '12 hours'))
    FOR UPDATE SKIP LOCKED
  LOOP
    IF r.contracts_total > 0 AND r.contracts_completed > 0 THEN
      v_ratio := r.contracts_completed::NUMERIC / r.contracts_total::NUMERIC;
      v_commit_amount := ROUND(r.credits_reserved * v_ratio, 2);
    ELSE
      v_commit_amount := 0;
    END IF;
    v_release_amount := r.credits_reserved - v_commit_amount;

    IF v_commit_amount > 0 THEN
      PERFORM public.cli_commit_credits(
        r.user_id, v_commit_amount, r.id,
        'Auto-settle: ' || COALESCE(r.contracts_completed, 0) || '/' || COALESCE(r.contracts_total, 0) || ' contracts'
      );
    END IF;

    IF v_release_amount > 0 THEN
      PERFORM public.cli_release_credits(
        r.user_id, v_release_amount, r.id,
        'Auto-settle release: stale session'
      );
    END IF;

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

-- Fix 3: Add current_phase column
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS current_phase TEXT;

-- Fix 4: Add findings_count column
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS findings_count INTEGER DEFAULT 0;
