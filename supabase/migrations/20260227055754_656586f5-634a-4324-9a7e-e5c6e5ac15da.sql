
-- Add 'expired' to subscription_status enum
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'expired';

-- Create function to expire overdue subscriptions
CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();
END;
$$;
