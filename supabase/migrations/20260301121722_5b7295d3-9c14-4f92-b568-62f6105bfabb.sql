
-- M4: Create function to expire stale pending payment orders
CREATE OR REPLACE FUNCTION public.expire_stale_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.payment_orders
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '2 hours';
END;
$$;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- M4: Schedule stale order cleanup every hour
SELECT cron.schedule(
  'expire-stale-orders',
  '0 * * * *',
  $$SELECT public.expire_stale_orders();$$
);

-- M6: Schedule subscription expiry enforcement daily at midnight
SELECT cron.schedule(
  'expire-overdue-subscriptions',
  '0 0 * * *',
  $$SELECT public.expire_overdue_subscriptions();$$
);

-- H8: Schedule auto-settle stale audit sessions every 15 minutes
SELECT cron.schedule(
  'auto-settle-stale-sessions',
  '*/15 * * * *',
  $$SELECT public.auto_settle_stale_sessions();$$
);
