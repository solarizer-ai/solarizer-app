-- B3: Update auto_settle_stale_sessions (already correct but re-create for safety)
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
        (last_heartbeat IS NOT NULL
         AND last_heartbeat < now() - interval '12 hours')
        OR
        (last_heartbeat IS NULL
         AND created_at < now() - interval '12 hours')
      )
    FOR UPDATE SKIP LOCKED
  LOOP
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

-- B3: Drop credits_reserved columns
ALTER TABLE public.audits DROP COLUMN IF EXISTS credits_reserved;
ALTER TABLE public.nloc_credits DROP COLUMN IF EXISTS credits_reserved;

-- B4: Add idempotency_key column
ALTER TABLE public.audits ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX idx_audits_idempotency_key
  ON public.audits (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- B5: Credit reconciliation function
CREATE OR REPLACE FUNCTION public.cli_reconcile_credits()
RETURNS TABLE (
  user_id UUID,
  ledger_balance NUMERIC,
  computed_balance NUMERIC,
  drift NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nc.user_id,
    nc.credits_remaining::NUMERIC AS ledger_balance,
    COALESCE(
      (SELECT SUM(ct.amount)
       FROM public.credit_txns ct
       WHERE ct.user_id = nc.user_id), 0
    ) AS computed_balance,
    nc.credits_remaining::NUMERIC - COALESCE(
      (SELECT SUM(ct.amount)
       FROM public.credit_txns ct
       WHERE ct.user_id = nc.user_id), 0
    ) AS drift
  FROM public.nloc_credits nc
  WHERE ABS(
    nc.credits_remaining::NUMERIC - COALESCE(
      (SELECT SUM(ct.amount)
       FROM public.credit_txns ct
       WHERE ct.user_id = nc.user_id), 0
    )
  ) > 0.01;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;