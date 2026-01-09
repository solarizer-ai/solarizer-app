-- Add restrictive INSERT policy for subscriptions table
-- Only admins can insert subscriptions directly (handle_new_user trigger uses SECURITY DEFINER to bypass RLS)
CREATE POLICY "Only admins can create subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));