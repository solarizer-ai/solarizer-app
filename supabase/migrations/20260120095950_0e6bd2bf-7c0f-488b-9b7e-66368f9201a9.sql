-- Fix 1: Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Fix 2: Deny anonymous access to audit_shares table
CREATE POLICY "Deny anonymous access to audit_shares"
ON public.audit_shares
FOR SELECT
TO anon
USING (false);

-- Fix 3: Add restrictive policies for power_up_purchases table (INSERT/UPDATE/DELETE)
-- Only allow service_role or admin to insert purchase records (via RPC function)
CREATE POLICY "Deny direct insert to power_up_purchases"
ON public.power_up_purchases
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny update to power_up_purchases"
ON public.power_up_purchases
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny delete from power_up_purchases"
ON public.power_up_purchases
FOR DELETE
TO authenticated
USING (false);

-- Fix 4: Create a secure search function to replace public profile queries
-- First, drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.profiles;

-- Create secure search function with exact email match only
CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email TEXT)
RETURNS TABLE (user_id UUID, display_name TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Require exact email match, return minimal data (no email field to prevent harvesting)
  RETURN QUERY
  SELECT p.user_id, p.display_name
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(search_email)
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_user_by_email(TEXT) TO authenticated;

-- Create function to get owner info securely (only for users who have access to shared audits)
CREATE OR REPLACE FUNCTION public.get_audit_owner_info(owner_user_id UUID)
RETURNS TABLE (email TEXT, display_name TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if the caller is the owner or has been shared an audit by this owner
  IF auth.uid() = owner_user_id OR EXISTS (
    SELECT 1 FROM audit_shares
    WHERE audit_shares.owner_id = owner_user_id
    AND audit_shares.shared_with_user_id = auth.uid()
  ) THEN
    RETURN QUERY
    SELECT p.email, p.display_name
    FROM profiles p
    WHERE p.user_id = owner_user_id
    LIMIT 1;
  ELSE
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_audit_owner_info(UUID) TO authenticated;