-- Drop the cf_subscription_events table
DROP TABLE IF EXISTS public.cf_subscription_events;

-- Drop Cashfree-only DB functions
DROP FUNCTION IF EXISTS public.activate_subscription(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.process_subscription_renewal(text, text, integer);
DROP FUNCTION IF EXISTS public.handle_subscription_payment_failed(text, text);
DROP FUNCTION IF EXISTS public.process_upgrade_success(uuid, text, text, text);

-- Remove Cashfree columns from subscriptions table
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cf_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cf_plan_id;