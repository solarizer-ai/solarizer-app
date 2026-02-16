import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ApiKey {
  id: string;
  name: string | null;
  key_prefix: string;
  created_at: string | null;
  last_used_at: string | null;
}

export function useApiKeys() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at')
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.functions.invoke('cli-generate-api-key', {
        body: { name },
      });
      if (error) throw error;
      return data as { key: string; prefix: string; name: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });
}

export function useRevealApiKey() {
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase.functions.invoke('cli-reveal-api-key', {
        body: { keyId },
      });
      if (error) throw error;
      return data as { key: string };
    },
  });
}
