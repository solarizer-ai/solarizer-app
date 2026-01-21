import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GitHubConnection {
  id: string;
  user_id: string;
  github_username: string;
  github_avatar_url: string | null;
  scopes: string[] | null;
  connected_at: string;
  updated_at: string;
}

export function useGitHubConnection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['github-connection', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('github_connections')
        .select('id, user_id, github_username, github_avatar_url, scopes, connected_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GitHubConnection | null;
    },
    enabled: !!user?.id,
  });

  // Connect GitHub via edge function (handles token encryption)
  const connectMutation = useMutation({
    mutationFn: async ({ code, redirectUri }: { 
      code: string; 
      redirectUri: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Call edge function to securely exchange code for token and store encrypted
      const { data, error } = await supabase.functions.invoke('github-connect', {
        body: { code, redirect_uri: redirectUri },
      });

      if (error) throw new Error(error.message || 'Failed to connect GitHub');
      if (!data.success) throw new Error(data.error || 'Failed to connect GitHub');

      // Refetch connection to get updated data
      const { data: connection, error: fetchError } = await supabase
        .from('github_connections')
        .select('id, user_id, github_username, github_avatar_url, scopes, connected_at, updated_at')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      return connection as GitHubConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-connection', user?.id] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('github_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-connection', user?.id] });
    },
  });

  return {
    connection: query.data,
    isConnected: !!query.data,
    isLoading: query.isLoading,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
  };
}
