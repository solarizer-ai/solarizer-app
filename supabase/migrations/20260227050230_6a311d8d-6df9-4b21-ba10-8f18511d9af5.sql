
-- First drop the policy that depends on rz_subscription_id
DROP POLICY IF EXISTS "Users can view their own subscription events" ON public.subscription_events;

-- Now drop unused Razorpay subscription columns
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS rz_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS rz_plan_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_method_saved;

-- Drop the reactivate_subscription RPC (no-op in one-time payment model)
DROP FUNCTION IF EXISTS public.reactivate_subscription();

-- Replace with a deny-all SELECT policy (subscription_events are only accessed via service role)
CREATE POLICY "Users can view their own subscription events"
ON public.subscription_events
FOR SELECT
USING (false);
