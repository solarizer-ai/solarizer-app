-- Add explicit deny policies for nloc_credits to prevent user manipulation
-- This ensures only system/admin functions can modify credit records

-- Deny direct INSERT to nloc_credits for regular users
CREATE POLICY "Deny direct insert to nloc_credits"
  ON public.nloc_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Deny direct UPDATE to nloc_credits for regular users  
CREATE POLICY "Deny direct update to nloc_credits"
  ON public.nloc_credits
  FOR UPDATE
  TO authenticated
  USING (false);

-- Deny direct DELETE to nloc_credits for regular users
CREATE POLICY "Deny direct delete to nloc_credits"
  ON public.nloc_credits
  FOR DELETE
  TO authenticated
  USING (false);