-- Reset Starter users: 2 scans, 300 nLOC credits
UPDATE public.nloc_credits nc
SET 
  scans_remaining = 2,
  credits_remaining = 300,
  credits_used_this_period = 0
FROM public.subscriptions s
WHERE nc.user_id = s.user_id 
  AND s.plan = 'starter';

-- Reset Pro users: keep scans unlimited (not tracked), reset to 1500 nLOC
UPDATE public.nloc_credits nc
SET 
  credits_remaining = 1500,
  credits_used_this_period = 0
FROM public.subscriptions s
WHERE nc.user_id = s.user_id 
  AND s.plan = 'pro';

-- For users without a subscription record, reset to Starter defaults
UPDATE public.nloc_credits nc
SET 
  scans_remaining = 2,
  credits_remaining = 300,
  credits_used_this_period = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = nc.user_id
);

-- Initialize credits for any existing auth users who don't have credits yet
INSERT INTO public.nloc_credits (user_id, credits_remaining, scans_remaining, credits_used_this_period)
SELECT 
  au.id,
  300,
  2,
  0
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.nloc_credits nc WHERE nc.user_id = au.id
);