import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditShare {
  id: string;
  audit_id: string;
  owner_id: string;
  shared_with_user_id: string;
  shared_with_email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

// Fetch all shares for an audit (for owners to see who has access)
export const useAuditShares = (auditId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-shares', auditId],
    queryFn: async () => {
      if (!auditId) return [];

      const { data, error } = await supabase
        .from('audit_shares')
        .select('*')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AuditShare[];
    },
    enabled: !!user && !!auditId,
  });
};

// Search for a user by email using secure RPC function
export const useSearchUserByEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .rpc('search_user_by_email', { search_email: email });

      if (error) throw error;
      // The RPC returns an array, get the first result
      const result = Array.isArray(data) ? data[0] : data;
      return result ? { user_id: result.user_id, display_name: result.display_name, email } : null;
    },
  });
};

// Add a share (creates pending invitation)
export const useAddShare = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      auditId,
      sharedWithUserId,
      sharedWithEmail,
    }: {
      auditId: string;
      sharedWithUserId: string;
      sharedWithEmail: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('audit_shares')
        .insert({
          audit_id: auditId,
          owner_id: user.id,
          shared_with_user_id: sharedWithUserId,
          shared_with_email: sharedWithEmail,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user already has a pending invitation or access to this report');
        }
        throw error;
      }
      return data as AuditShare;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-shares', data.audit_id] });
    },
  });
};

// Remove a share (owner cancels invitation or revokes access)
export const useRemoveShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, auditId }: { shareId: string; auditId: string }) => {
      const { error } = await supabase
        .from('audit_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      return { auditId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-shares', data.auditId] });
    },
  });
};

// Get share count for an audit (only accepted shares)
export const useAuditShareCount = (auditId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-share-count', auditId],
    queryFn: async () => {
      if (!auditId) return 0;

      const { count, error } = await supabase
        .from('audit_shares')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', auditId)
        .eq('status', 'accepted');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && !!auditId,
  });
};

// Check if current user is the owner of an audit
export const useIsAuditOwner = (auditUserId: string | undefined) => {
  const { user } = useAuth();
  return user?.id === auditUserId;
};

// Get owner info for a shared audit using secure RPC function
export const useAuditOwnerInfo = (ownerId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-owner-info', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;

      const { data, error } = await supabase
        .rpc('get_audit_owner_info', { owner_user_id: ownerId });

      if (error) throw error;
      // The RPC returns an array, get the first result
      const result = Array.isArray(data) ? data[0] : data;
      return result || null;
    },
    enabled: !!user && !!ownerId,
  });
};
