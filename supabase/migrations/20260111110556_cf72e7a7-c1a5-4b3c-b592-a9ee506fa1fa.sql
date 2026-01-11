-- Backfill profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, email, display_name)
SELECT 
  id,
  email,
  split_part(email, '@', 1)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;