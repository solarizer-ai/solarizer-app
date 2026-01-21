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

  const connectMutation = useMutation({
    mutationFn: async ({ accessToken, username, avatarUrl, scopes }: { 
      accessToken: string; 
      username: string; 
      avatarUrl?: string;
      scopes?: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('github_connections')
        .upsert({
          user_id: user.id,
          github_username: username,
          github_access_token: accessToken,
          github_avatar_url: avatarUrl || null,
          scopes: scopes || null,
        }, { onConflict: 'user_id' })
        .select('id, user_id, github_username, github_avatar_url, scopes, connected_at, updated_at')
        .single();

      if (error) throw error;
      return data as GitHubConnection;
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
