-- Add RLS policies for cf_subscription_events table
-- This table stores payment webhook events and should only be readable by subscription owners
-- Writes are performed via service role by edge functions (webhooks)

-- Policy: Users can view their own subscription events by joining through subscriptions table
CREATE POLICY "Users can view their own subscription events"
ON public.cf_subscription_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.cf_subscription_id = cf_subscription_events.cf_subscription_id
    AND s.user_id = auth.uid()
  )
);

-- Block all direct user modifications (data is managed by webhook edge functions via service role)
CREATE POLICY "Deny direct insert to cf_subscription_events"
ON public.cf_subscription_events
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct update to cf_subscription_events"
ON public.cf_subscription_events
FOR UPDATE
USING (false);

CREATE POLICY "Deny direct delete from cf_subscription_events"
ON public.cf_subscription_events
FOR DELETE
USING (false);