-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, email)
);

-- Create indexes
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (owner_id = auth.uid());

-- RLS Policies for team_members
CREATE POLICY "Team members can view other members"
ON public.team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Team owners and admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'admin')
  )
  OR (
    -- Allow owner to add themselves when creating team
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team owners and admins can remove members"
ON public.team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'admin')
  )
  AND role != 'owner' -- Prevent removing team owner
);

-- RLS Policies for team_invitations
CREATE POLICY "Team members can view invitations"
ON public.team_invitations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_invitations.team_id AND tm.user_id = auth.uid()
  )
  OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Team owners and admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_invitations.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Team owners and admins can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = team_invitations.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Invitees can update their invitation (accept)"
ON public.team_invitations FOR UPDATE
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  AND accepted_at IS NULL
  AND expires_at > now()
)
WITH CHECK (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Add trigger for updated_at on teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to accept invitation and join team
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Check team member limit (5 for Business plan)
  SELECT COUNT(*) INTO v_member_count FROM team_members WHERE team_id = v_invitation.team_id;
  IF v_member_count >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team has reached maximum member limit');
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role, invited_by)
  VALUES (v_invitation.team_id, auth.uid(), v_invitation.role, v_invitation.invited_by)
  ON CONFLICT (team_id, user_id) DO NOTHING;
  
  -- Mark invitation as accepted
  UPDATE team_invitations SET accepted_at = now() WHERE id = invitation_id;
  
  RETURN jsonb_build_object('success', true, 'team_id', v_invitation.team_id);
END;
$$;