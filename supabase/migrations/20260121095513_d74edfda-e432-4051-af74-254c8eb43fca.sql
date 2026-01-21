-- Add pending invitation status to audit_shares
ALTER TABLE audit_shares 
ADD COLUMN status text NOT NULL DEFAULT 'pending',
ADD COLUMN invited_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN accepted_at timestamptz,
ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');

-- Update existing shares to be accepted (they were instant access before)
UPDATE audit_shares SET status = 'accepted', accepted_at = created_at;

-- Drop existing RLS policies to recreate them
DROP POLICY IF EXISTS "Users can view shares for audits they own or are shared with" ON audit_shares;
DROP POLICY IF EXISTS "Only audit owners can create shares" ON audit_shares;
DROP POLICY IF EXISTS "Only audit owners can delete shares" ON audit_shares;
DROP POLICY IF EXISTS "Deny anonymous access to audit_shares" ON audit_shares;

-- Owners can view all shares for their audits
CREATE POLICY "Owners can view shares for their audits"
ON audit_shares FOR SELECT
USING (auth.uid() = owner_id);

-- Users can view their own accepted shares
CREATE POLICY "Users can view their accepted shares"
ON audit_shares FOR SELECT
USING (auth.uid() = shared_with_user_id AND status = 'accepted');

-- Users can view pending invitations for their email
CREATE POLICY "Users can view their pending invitations"
ON audit_shares FOR SELECT
USING (
  shared_with_email = (SELECT profiles.email FROM profiles WHERE profiles.user_id = auth.uid())
  AND status = 'pending'
  AND expires_at > now()
);

-- Owners can create shares
CREATE POLICY "Owners can create shares"
ON audit_shares FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can delete shares
CREATE POLICY "Owners can delete shares"
ON audit_shares FOR DELETE
USING (auth.uid() = owner_id);

-- Invitees can decline (delete) their pending invitations
CREATE POLICY "Invitees can decline pending invitations"
ON audit_shares FOR DELETE
USING (
  shared_with_email = (SELECT profiles.email FROM profiles WHERE profiles.user_id = auth.uid())
  AND status = 'pending'
);

-- Invitees can accept their invitations (update status)
CREATE POLICY "Invitees can accept invitations"
ON audit_shares FOR UPDATE
USING (
  shared_with_user_id = auth.uid()
  AND status = 'pending'
  AND expires_at > now()
)
WITH CHECK (
  shared_with_user_id = auth.uid()
  AND status = 'accepted'
);

-- Update the audits RLS policy to only allow access to accepted shares
DROP POLICY IF EXISTS "Users can view audits shared with them" ON audits;

CREATE POLICY "Users can view audits shared with them"
ON audits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM audit_shares
    WHERE audit_shares.audit_id = audits.id
    AND audit_shares.shared_with_user_id = auth.uid()
    AND audit_shares.status = 'accepted'
  )
);

-- Create RPC to get pending share invitations for current user
CREATE OR REPLACE FUNCTION get_my_pending_share_invitations()
RETURNS TABLE (
  id uuid,
  audit_id uuid,
  owner_id uuid,
  project_name text,
  owner_email text,
  owner_display_name text,
  invited_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT p.email INTO v_user_email FROM profiles p WHERE p.user_id = auth.uid();
  
  IF v_user_email IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.audit_id,
    s.owner_id,
    a.project_name,
    op.email as owner_email,
    op.display_name as owner_display_name,
    s.invited_at,
    s.expires_at
  FROM audit_shares s
  JOIN audits a ON a.id = s.audit_id
  JOIN profiles op ON op.user_id = s.owner_id
  WHERE s.shared_with_email = v_user_email
    AND s.status = 'pending'
    AND s.expires_at > now()
  ORDER BY s.invited_at DESC;
END;
$$;

-- Create RPC to accept a share invitation
CREATE OR REPLACE FUNCTION accept_share_invitation(p_share_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share audit_shares%ROWTYPE;
  v_user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT p.email INTO v_user_email FROM profiles p WHERE p.user_id = auth.uid();
  
  -- Get the share
  SELECT * INTO v_share FROM audit_shares WHERE id = p_share_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;
  
  -- Verify invitation is for this user
  IF v_share.shared_with_email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is for a different email');
  END IF;
  
  -- Check if already accepted
  IF v_share.status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation already accepted');
  END IF;
  
  -- Check if expired
  IF v_share.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;
  
  -- Accept the invitation
  UPDATE audit_shares
  SET status = 'accepted', accepted_at = now()
  WHERE id = p_share_id;
  
  RETURN jsonb_build_object('success', true, 'audit_id', v_share.audit_id);
END;
$$;

-- Drop team-related tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Drop team-related function
DROP FUNCTION IF EXISTS accept_team_invitation(uuid);