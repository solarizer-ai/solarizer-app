-- Add scans_remaining column to nloc_credits table
ALTER TABLE public.nloc_credits 
ADD COLUMN IF NOT EXISTS scans_remaining INTEGER NOT NULL DEFAULT 2;

-- Update existing records to have scans based on their usage
-- For existing users, calculate scans remaining based on current audit count
UPDATE public.nloc_credits nc
SET scans_remaining = GREATEST(0, 2 - (
  SELECT COUNT(*) FROM public.audits a WHERE a.user_id = nc.user_id
));

-- Create or replace the function to initialize user credits on signup
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.nloc_credits (user_id, credits_remaining, scans_remaining, credits_used_this_period)
  VALUES (NEW.id, 300, 2, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_user_created_init_credits ON auth.users;
CREATE TRIGGER on_user_created_init_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();