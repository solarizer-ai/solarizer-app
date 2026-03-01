
CREATE OR REPLACE FUNCTION public.auto_settle_stale_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'Auto-settle: full refund for stale session (12h timeout)'
    );
    UPDATE public.audits
    SET status = 'failed',
        is_locked = true,
        credits_deducted = 0,
        error_message = 'Auto-settled: session stale (no heartbeat for 12 hours)',
        updated_at = now()
    WHERE id = r.id;
  END LOOP;
END;
$function$;
