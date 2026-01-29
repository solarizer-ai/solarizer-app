import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FindingCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ActiveAnalysis {
  id: string;
  project_name: string;
  status: 'pending' | 'analyzing';
  created_at: string;
  findingCounts: FindingCounts;
}

export const useActiveAnalyses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-analyses', user?.id],
    queryFn: async (): Promise<ActiveAnalysis[]> => {
      // Fetch audits in pending or analyzing status
      const { data: audits, error: auditsError } = await supabase
        .from('audits')
        .select('id, project_name, status, created_at')
        .in('status', ['pending', 'analyzing'])
        .order('created_at', { ascending: false });

      if (auditsError) throw auditsError;
      if (!audits || audits.length === 0) return [];

      const auditIds = audits.map(a => a.id);

      // Fetch findings for these audits
      const { data: findings, error: findingsError } = await supabase
        .from('findings')
        .select('audit_id, severity')
        .in('audit_id', auditIds);

      if (findingsError) throw findingsError;

      // Aggregate finding counts by audit and severity
      const countsByAudit: Record<string, FindingCounts> = {};
      
      for (const auditId of auditIds) {
        countsByAudit[auditId] = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        };
      }

      for (const finding of findings || []) {
        const severity = finding.severity as keyof FindingCounts;
        if (countsByAudit[finding.audit_id] && severity in countsByAudit[finding.audit_id]) {
          countsByAudit[finding.audit_id][severity]++;
        }
      }

      // Combine audits with their finding counts
      return audits.map(audit => ({
        id: audit.id,
        project_name: audit.project_name,
        status: audit.status as 'pending' | 'analyzing',
        created_at: audit.created_at,
        findingCounts: countsByAudit[audit.id],
      }));
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
};
