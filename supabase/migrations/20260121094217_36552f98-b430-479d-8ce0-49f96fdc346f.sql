-- Update accept_team_invitation function to exclude owner from the 5-member limit
-- This allows: 1 owner + 5 collaborators = 6 total people
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation team_invitations%ROWTYPE;
  v_user_email TEXT;
  v_member_count INT;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM profiles WHERE id = auth.uid();
  
  -- Get invitation
  SELECT * INTO v_invitation FROM team_invitations WHERE id = invitation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;
  
  -- Verify invitation is for this user
  IF v_invitation.email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is for a different email');
  END IF;
  
  -- Check if already accepted
  IF v_invitation.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation already accepted');
  END IF;
  
  -- Check if expired
  IF v_invitation.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  -- Check team collaborator limit (5 collaborators, excluding owner)
  SELECT COUNT(*) INTO v_member_count 
  FROM team_members 
  WHERE team_id = v_invitation.team_id AND role != 'owner';
  
  IF v_member_count >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team has reached maximum collaborator limit');
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role, invited_by)
  VALUES (v_invitation.team_id, auth.uid(), v_invitation.role, v_invitation.invited_by)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE team_invitations SET accepted_at = now() WHERE id = invitation_id;
  
  RETURN jsonb_build_object('success', true, 'team_id', v_invitation.team_id);
END;
$function$;