import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StatusHistoryEntry {
  id: string;
  finding_id: string;
  old_resolved: boolean | null;
  new_resolved: boolean;
  changed_by: string;
  changed_at: string;
  comment: string | null;
  user_email?: string;
}

export interface RemediationStats {
  total: number;
  resolved: number;
  percentage: number;
  bySeverity: {
    critical: { total: number; resolved: number };
    high: { total: number; resolved: number };
    medium: { total: number; resolved: number };
    low: { total: number; resolved: number };
    info: { total: number; resolved: number };
  };
}

/**
 * Hook to fetch status history for a specific finding
 */
export function useStatusHistory(findingId: string | undefined) {
  return useQuery({
    queryKey: ['finding-status-history', findingId],
    queryFn: async () => {
      if (!findingId) return [];
      
      const { data, error } = await supabase
        .from('finding_status_history')
        .select('*')
        .eq('finding_id', findingId)
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user emails for history entries
      const historyWithEmails: StatusHistoryEntry[] = [];
      
      for (const entry of data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', entry.changed_by)
          .single();
        
        historyWithEmails.push({
          ...entry,
          user_email: profile?.email || 'Unknown User'
        });
      }
      
      return historyWithEmails;
    },
    enabled: !!findingId,
  });
}

/**
 * Hook to toggle finding resolved status
 */
export function useToggleFindingResolved() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      findingId, 
      isResolved, 
      comment 
    }: { 
      findingId: string; 
      isResolved: boolean; 
      comment?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Get current finding state
      const { data: finding, error: findingError } = await supabase
        .from('findings')
        .select('is_resolved')
        .eq('id', findingId)
        .single();
      
      if (findingError) throw findingError;
      
      // Update finding resolved status
      const { error: updateError } = await supabase
        .from('findings')
        .update({
          is_resolved: isResolved,
          resolved_at: isResolved ? new Date().toISOString() : null,
          resolved_by: isResolved ? user.id : null,
        })
        .eq('id', findingId);
      
      if (updateError) throw updateError;
      
      // Add status history entry
      const { error: historyError } = await supabase
        .from('finding_status_history')
        .insert({
          finding_id: findingId,
          old_resolved: finding.is_resolved ?? false,
          new_resolved: isResolved,
          changed_by: user.id,
          comment: comment?.trim() || null,
        });
      
      if (historyError) throw historyError;
      
      return { findingId, isResolved };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['finding-status-history', result.findingId] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['remediation-stats'] });
    },
  });
}

/**
 * Hook to calculate remediation progress stats for an audit
 */
export function useRemediationStats(auditId: string | undefined) {
  return useQuery({
    queryKey: ['remediation-stats', auditId],
    queryFn: async (): Promise<RemediationStats> => {
      if (!auditId) {
        return {
          total: 0,
          resolved: 0,
          percentage: 0,
          bySeverity: {
            critical: { total: 0, resolved: 0 },
            high: { total: 0, resolved: 0 },
            medium: { total: 0, resolved: 0 },
            low: { total: 0, resolved: 0 },
            info: { total: 0, resolved: 0 },
          },
        };
      }
      
      const { data: findings, error } = await supabase
        .from('findings')
        .select('id, severity, is_resolved')
        .eq('audit_id', auditId);
      
      if (error) throw error;
      
      const stats: RemediationStats = {
        total: findings.length,
        resolved: findings.filter(f => f.is_resolved).length,
        percentage: 0,
        bySeverity: {
          critical: { total: 0, resolved: 0 },
          high: { total: 0, resolved: 0 },
          medium: { total: 0, resolved: 0 },
          low: { total: 0, resolved: 0 },
          info: { total: 0, resolved: 0 },
        },
      };
      
      stats.percentage = stats.total > 0 
        ? Math.round((stats.resolved / stats.total) * 100) 
        : 0;
      
      for (const finding of findings) {
        const severity = finding.severity as keyof typeof stats.bySeverity;
        if (stats.bySeverity[severity]) {
          stats.bySeverity[severity].total++;
          if (finding.is_resolved) {
            stats.bySeverity[severity].resolved++;
          }
        }
      }
      
      return stats;
    },
    enabled: !!auditId,
  });
}
