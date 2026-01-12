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

// Fetch lifetime stats that persist even when audits are deleted
const useLifetimeStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['lifetime-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('lifetime_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Fetch all findings for all user's audits (for severity breakdown and current vulns)
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
  const { data: lifetimeStats, isLoading: lifetimeLoading } = useLifetimeStats();
  
  const stats = useMemo(() => {
    if (!audits) {
      return {
        totalContractsScanned: lifetimeStats?.total_contracts_scanned || 0,
        totalVulnerabilitiesFound: lifetimeStats?.total_vulnerabilities_found || 0,
        totalNlocAnalyzed: lifetimeStats?.total_nloc_analyzed || 0,
        averageSecurityScore: 0,
        severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        recentActivity: [],
        securityScoreTrend: [],
      };
    }

    // Use lifetime stats for persistent metrics (don't reset on deletion)
    const totalContractsScanned = lifetimeStats?.total_contracts_scanned || 
      audits.reduce((acc, audit) => acc + (audit.contract_count || 0), 0);
    
    const totalVulnerabilitiesFound = lifetimeStats?.total_vulnerabilities_found || 
      (allFindings?.length || 0);
    
    const totalNlocAnalyzed = lifetimeStats?.total_nloc_analyzed || 
      audits.reduce((acc, audit) => acc + (audit.nloc_count || 0), 0);
    
    // Average security score (calculated from current audits - can reset on deletion)
    const completedAudits = audits.filter(a => a.security_score !== null);
    const averageSecurityScore = completedAudits.length > 0
      ? Math.round(completedAudits.reduce((acc, a) => acc + (a.security_score || 0), 0) / completedAudits.length)
      : 0;
    
    // Severity breakdown (from current findings for accurate display)
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
  }, [audits, allFindings, lifetimeStats]);
  
  return {
    stats,
    isLoading: auditsLoading || findingsLoading || lifetimeLoading,
  };
};

// Response type for server-side stats operations
interface StatsOperationResponse {
  success: boolean;
  error?: string;
  contracts_added?: number;
  vulnerabilities_added?: number;
  nloc_added?: number;
}

// Hook to update lifetime stats when a new audit is created
// Uses secure server-side function to prevent manipulation
export const useUpdateLifetimeStats = () => {
  const { user } = useAuth();
  
  const updateStats = async (contractCount: number, vulnerabilitiesCount: number, nlocCount: number) => {
    if (!user) return;
    
    // Call the secure server-side function for incrementing stats
    // This prevents users from directly manipulating their statistics
    const { data, error } = await supabase.rpc('increment_lifetime_stats', {
      p_contracts: contractCount,
      p_vulnerabilities: vulnerabilitiesCount,
      p_nloc: nlocCount,
    });

    if (error) {
      console.error('Failed to update lifetime stats:', error);
      throw error;
    }
    
    const result = data as unknown as StatsOperationResponse;
    
    if (!result?.success) {
      console.error('Failed to update lifetime stats:', result?.error);
      throw new Error(result?.error || 'Failed to update lifetime stats');
    }
  };
  
  return { updateStats };
};
