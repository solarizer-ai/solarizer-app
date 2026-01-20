import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FindingComment {
  id: string;
  finding_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

/**
 * Hook to fetch comments for a specific finding
 */
export function useFindingComments(findingId: string | undefined) {
  return useQuery({
    queryKey: ['finding-comments', findingId],
    queryFn: async () => {
      if (!findingId) return [];
      
      const { data, error } = await supabase
        .from('finding_comments')
        .select('*')
        .eq('finding_id', findingId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch user emails for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const commentsWithEmails: FindingComment[] = [];
      
      for (const comment of data) {
        // Use the profile lookup for each user
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', comment.user_id)
          .single();
        
        commentsWithEmails.push({
          ...comment,
          user_email: profile?.email || 'Unknown User'
        });
      }
      
      return commentsWithEmails;
    },
    enabled: !!findingId,
  });
}

/**
 * Hook to add a comment to a finding
 */
export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ findingId, content }: { findingId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('finding_comments')
        .insert({
          finding_id: findingId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finding-comments', variables.findingId] });
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, findingId }: { commentId: string; findingId: string }) => {
      const { error } = await supabase
        .from('finding_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      return { commentId, findingId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['finding-comments', result.findingId] });
    },
  });
}
