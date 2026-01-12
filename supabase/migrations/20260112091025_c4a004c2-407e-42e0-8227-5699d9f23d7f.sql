-- Fix 1: Remove dangerous UPDATE policy on subscriptions that allows privilege escalation
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;

-- Create a restricted UPDATE policy that only allows status changes (not plan changes)
-- This allows users to cancel but not upgrade themselves
CREATE POLICY "Users can only cancel their subscription" 
ON subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND plan = (SELECT plan FROM subscriptions WHERE user_id = auth.uid())
);

-- Fix 2: Remove dangerous INSERT/UPDATE policies on lifetime_stats
DROP POLICY IF EXISTS "Users can insert their own lifetime stats" ON lifetime_stats;
DROP POLICY IF EXISTS "Users can update their own lifetime stats" ON lifetime_stats;

-- Create a SECURITY DEFINER function to safely increment lifetime stats
-- This should only be called after an audit completes, not directly by users
CREATE OR REPLACE FUNCTION public.increment_lifetime_stats(
  p_contracts INTEGER,
  p_vulnerabilities INTEGER,
  p_nloc BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  -- Require authentication
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate input - only allow positive increments
  IF p_contracts < 0 OR p_vulnerabilities < 0 OR p_nloc < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid increment values');
  END IF;

  -- Limit maximum increment per call to prevent abuse
  IF p_contracts > 100 OR p_vulnerabilities > 1000 OR p_nloc > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Increment values too large');
  END IF;

  -- Upsert the lifetime stats
  INSERT INTO lifetime_stats (
    user_id, 
    total_contracts_scanned, 
    total_vulnerabilities_found, 
    total_nloc_analyzed
  )
  VALUES (
    v_user_id, 
    p_contracts, 
    p_vulnerabilities, 
    p_nloc
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_contracts_scanned = lifetime_stats.total_contracts_scanned + EXCLUDED.total_contracts_scanned,
    total_vulnerabilities_found = lifetime_stats.total_vulnerabilities_found + EXCLUDED.total_vulnerabilities_found,
    total_nloc_analyzed = lifetime_stats.total_nloc_analyzed + EXCLUDED.total_nloc_analyzed,
    updated_at = now();

  RETURN json_build_object(
    'success', true,
    'contracts_added', p_contracts,
    'vulnerabilities_added', p_vulnerabilities,
    'nloc_added', p_nloc
  );
END;
$$;