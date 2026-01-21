-- RPC function to get audit access context (ownership and owner's plan)
CREATE OR REPLACE FUNCTION public.get_audit_access_context(p_audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_audit_owner_id UUID;
  v_owner_plan TEXT;
  v_is_owner BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Get audit owner
  SELECT user_id INTO v_audit_owner_id
  FROM audits
  WHERE id = p_audit_id;
  
  IF v_audit_owner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Audit not found');
  END IF;
  
  -- Check if user is owner
  v_is_owner := (v_user_id = v_audit_owner_id);
  
  -- Verify user has access (owner or shared)
  IF NOT v_is_owner AND NOT EXISTS (
    SELECT 1 FROM audit_shares
    WHERE audit_id = p_audit_id AND shared_with_user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;
  
  -- Get owner's subscription plan
  SELECT plan::text INTO v_owner_plan
  FROM subscriptions
  WHERE user_id = v_audit_owner_id
  LIMIT 1;
  
  RETURN jsonb_build_object(
    'is_owner', v_is_owner,
    'owner_plan', COALESCE(v_owner_plan, 'starter')
  );
END;
$function$;