-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('starter', 'pro');

-- Create subscription status enum  
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due');

-- User subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'starter',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- nLOC credits ledger
CREATE TABLE public.nloc_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,
  period_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Power-up purchases log
CREATE TABLE public.power_up_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nloc_amount INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add nloc_count to audits table
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS nloc_count INTEGER DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nloc_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_up_purchases ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS policies
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- nloc_credits RLS policies
CREATE POLICY "Users can view their own credits"
ON public.nloc_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
ON public.nloc_credits FOR UPDATE
USING (auth.uid() = user_id);

-- power_up_purchases RLS policies
CREATE POLICY "Users can view their own purchases"
ON public.power_up_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
ON public.power_up_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to initialize subscription and credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create starter subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'starter', 'active');
  
  -- Initialize nLOC credits for starter (2 scans * 500 nLOC = tracked via scan count)
  INSERT INTO public.nloc_credits (user_id, credits_remaining, credits_used_this_period)
  VALUES (NEW.id, 1000, 0);
  
  RETURN NEW;
END;
$$;

-- Trigger for updating updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on nloc_credits
CREATE TRIGGER update_nloc_credits_updated_at
BEFORE UPDATE ON public.nloc_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();