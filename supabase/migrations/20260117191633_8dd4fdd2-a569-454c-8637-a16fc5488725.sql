-- Drop the overly permissive policy that allows any authenticated user to read all profiles
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.profiles;