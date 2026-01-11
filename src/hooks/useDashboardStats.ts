import { useMemo } from 'react';
import { useAudits } from './useAudits';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface DashboardStats {
  totalContractsScanned: number;
  totalVulnerabilitiesFound: number;
  totalNlocAnalyzed: number;
  averageSecurityScore: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  recentActivity: {
    id: string;
    projectName: string;
    action: 'created' | 'completed' | 'issues_found';
    timestamp: string;
    status: string;
    grade?: string;
  }[];
  securityScoreTrend: number[];
}

// Fetch all findings for all user's audits
const useAllFindings = () => {
  const { user } = useAuth();
  const { data: audits } = useAudits();
  
  return useQuery({
    queryKey: ['all-findings', user?.id],
    queryFn: async () => {
      if (!audits || audits.length === 0) return [];
      
      const auditIds = audits.map(a => a.id);
      const { data, error } = await supabase
        .from('findings')
        .select('*')
        .in('audit_id', auditIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!audits && audits.length > 0,
  });
};

export const useDashboardStats = (): { stats: DashboardStats; isLoading: boolean } => {
  const { data: audits, isLoading: auditsLoading } = useAudits();
  const { data: allFindings, isLoading: findingsLoading } = useAllFindings();
  
  const stats = useMemo(() => {
    if (!audits) {
      return {
        totalContractsScanned: 0,
        totalVulnerabilitiesFound: 0,
        totalNlocAnalyzed: 0,
        averageSecurityScore: 0,
        severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        recentActivity: [],
        securityScoreTrend: [],
      };
    }

    // Total contracts scanned (sum of contract_count)
    const totalContractsScanned = audits.reduce((acc, audit) => acc + (audit.contract_count || 0), 0);
    
    // Total vulnerabilities found
    const totalVulnerabilitiesFound = allFindings?.length || 0;
    
    // Total nLOC analyzed
    const totalNlocAnalyzed = audits.reduce((acc, audit) => acc + (audit.nloc_count || 0), 0);
    
    // Average security score (only from completed audits with a score)
    const completedAudits = audits.filter(a => a.security_score !== null);
    const averageSecurityScore = completedAudits.length > 0
      ? Math.round(completedAudits.reduce((acc, a) => acc + (a.security_score || 0), 0) / completedAudits.length)
      : 0;
    
    // Severity breakdown
    const severityBreakdown = {
      critical: allFindings?.filter(f => f.severity === 'critical').length || 0,
      high: allFindings?.filter(f => f.severity === 'high').length || 0,
      medium: allFindings?.filter(f => f.severity === 'medium').length || 0,
      low: allFindings?.filter(f => f.severity === 'low').length || 0,
      info: allFindings?.filter(f => f.severity === 'info').length || 0,
    };
    
    // Recent activity (last 5 audits)
    const recentActivity = audits.slice(0, 5).map(audit => ({
      id: audit.id,
      projectName: audit.project_name,
      action: audit.status === 'issues' ? 'issues_found' as const : 
              audit.status === 'secured' ? 'completed' as const : 'created' as const,
      timestamp: audit.updated_at || audit.created_at,
      status: audit.status,
      grade: audit.grade || undefined,
    }));
    
    // Security score trend (last 5 completed audits with scores)
    const securityScoreTrend = completedAudits
      .slice(0, 5)
      .map(a => a.security_score || 0)
      .reverse();
    
    return {
      totalContractsScanned,
      totalVulnerabilitiesFound,
      totalNlocAnalyzed,
      averageSecurityScore,
      severityBreakdown,
      recentActivity,
      securityScoreTrend,
    };
  }, [audits, allFindings]);
  
  return {
    stats,
    isLoading: auditsLoading || findingsLoading,
  };
};
