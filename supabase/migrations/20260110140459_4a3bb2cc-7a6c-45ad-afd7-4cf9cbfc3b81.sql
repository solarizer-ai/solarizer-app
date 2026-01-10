-- Create subscription_history table to track plan changes
CREATE TABLE public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  previous_plan subscription_plan,
  new_plan subscription_plan NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription history
CREATE POLICY "Users can view their own subscription history"
ON public.subscription_history
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger to log subscription changes
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    INSERT INTO public.subscription_history (user_id, previous_plan, new_plan)
    VALUES (NEW.user_id, OLD.plan, NEW.plan);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_subscription_plan_change
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_change();