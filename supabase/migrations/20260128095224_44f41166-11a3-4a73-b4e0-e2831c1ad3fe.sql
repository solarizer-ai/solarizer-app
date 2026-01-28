-- Fix subscription_history table: Add explicit INSERT denial policy
-- The table is only written to by the log_subscription_change() trigger (SECURITY DEFINER)
-- No direct user inserts should be allowed

-- Add policy to explicitly deny direct inserts (trigger runs as definer, bypasses RLS)
CREATE POLICY "Deny direct insert to subscription_history"
ON public.subscription_history
FOR INSERT
WITH CHECK (false);