import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string | null;
  joined_at: string;
  user_email?: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

/**
 * Hook to fetch the current user's team (Business plan users get one team)
 */
export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // First check if user owns a team
      const { data: ownedTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedTeam) return ownedTeam as Team;

      // Check if user is a member of any team
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', membership.team_id)
          .single();
        return team as Team;
      }

      return null;
    },
  });
}

/**
 * Hook to fetch team members
 */
export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch emails for each member
      const membersWithEmails: TeamMember[] = [];
      for (const member of data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', member.user_id)
          .single();

        membersWithEmails.push({
          ...member,
          role: member.role as 'owner' | 'admin' | 'member',
          user_email: profile?.email || 'Unknown',
        });
      }

      return membersWithEmails;
    },
    enabled: !!teamId,
  });
}

/**
 * Hook to fetch pending invitations for a team
 */
export function useTeamInvitations(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!teamId,
  });
}

/**
 * Hook to fetch invitations for current user
 */
export function useMyInvitations() {
  return useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profile?.email) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*, teams:team_id(name)')
        .eq('email', profile.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name, owner_id: user.id })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner',
          invited_by: user.id,
        });

      if (memberError) throw memberError;

      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

/**
 * Hook to invite a team member
 */
export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      teamId, 
      email, 
      role = 'member' 
    }: { 
      teamId: string; 
      email: string; 
      role?: 'admin' | 'member';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('An invitation has already been sent to this email');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', variables.teamId] });
    },
  });
}

/**
 * Hook to cancel an invitation
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, teamId }: { invitationId: string; teamId: string }) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      return { invitationId, teamId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', result.teamId] });
    },
  });
}

/**
 * Hook to accept an invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .rpc('accept_team_invitation', { invitation_id: invitationId });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; team_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
    },
  });
}

/**
 * Hook to remove a team member
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return { memberId, teamId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', result.teamId] });
    },
  });
}

/**
 * Hook to update team name
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
