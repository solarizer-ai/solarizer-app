import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AuditShare {
  id: string;
  audit_id: string;
  owner_id: string;
  shared_with_user_id: string;
  shared_with_email: string;
  created_at: string;
}

// Fetch all shares for an audit
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

// Search for a user by email
export const useSearchUserByEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

// Add a share
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
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user already has access to this audit');
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

// Remove a share
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

// Get share count for an audit
export const useAuditShareCount = (auditId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-share-count', auditId],
    queryFn: async () => {
      if (!auditId) return 0;

      const { count, error } = await supabase
        .from('audit_shares')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', auditId);

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

// Get owner info for a shared audit
export const useAuditOwnerInfo = (ownerId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-owner-info', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('user_id', ownerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!ownerId,
  });
};
