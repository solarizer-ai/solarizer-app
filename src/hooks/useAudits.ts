import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AuditStatus = 'pending' | 'analyzing' | 'secured' | 'issues' | 'cancelled' | 'failed';
export type SecurityGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'; // 'info' kept for DB compatibility but filtered in UI

export interface CoverageTestDetail {
  test_name: string;
  status: "PASSED" | "FAILED";
  proof: string | null;
  file: string;
  related_finding_title: string | null;
}

export interface CoverageData {
  total_tests: number;
  passed: number;
  failed: number;
  details: CoverageTestDetail[];
}

export interface Audit {
  id: string;
  user_id: string;
  project_name: string;
  contract_code: string;
  contract_count: number;
  nloc_count: number | null;
  status: AuditStatus;
  grade: SecurityGrade | null;
  security_score: number | null;
  coverage_data: CoverageData | null;
  system_hologram: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  share_count?: number;
}

export interface Finding {
  id: string;
  audit_id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  location: string | null;
  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;
  remediation: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface CreateAuditInput {
  project_name: string;
  contract_code: string;
  contract_count?: number;
  nloc_count?: number;
}

export interface CreateFindingInput {
  audit_id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  location?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  remediation?: string;
}

// Fetch all audits for the current user (including share count for owned audits)
export const useAudits = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['audits', user?.id],
    queryFn: async () => {
      // Fetch audits
      const { data: audits, error } = await supabase
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch share counts for owned audits
      const ownedAuditIds = (audits || [])
        .filter(a => a.user_id === user?.id)
        .map(a => a.id);
      
      let shareCounts: Record<string, number> = {};
      if (ownedAuditIds.length > 0) {
        const { data: shares } = await supabase
          .from('audit_shares')
          .select('audit_id')
          .in('audit_id', ownedAuditIds)
          .eq('status', 'accepted');
        
        if (shares) {
          shares.forEach(share => {
            shareCounts[share.audit_id] = (shareCounts[share.audit_id] || 0) + 1;
          });
        }
      }
      
      // Merge share counts into audits
      return (audits || []).map(audit => ({
        ...audit,
        share_count: shareCounts[audit.id] || 0,
      })) as unknown as Audit[];
    },
    enabled: !!user,
  });
};

// Fetch a single audit by ID
export const useAudit = (auditId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      if (!auditId) return null;
      
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as Audit | null;
    },
    enabled: !!user && !!auditId,
  });
};

// Fetch findings for an audit
export const useFindings = (auditId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['findings', auditId],
    queryFn: async () => {
      if (!auditId) return [];
      
      const { data, error } = await supabase
        .from('findings')
        .select('*')
        .eq('audit_id', auditId)
        .order('severity', { ascending: true });
      
      if (error) throw error;
      return data as Finding[];
    },
    enabled: !!user && !!auditId,
  });
};

// Create a new audit
export const useCreateAudit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: CreateAuditInput) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('audits')
        .insert({
          user_id: user.id,
          project_name: input.project_name,
          contract_code: input.contract_code,
          contract_count: input.contract_count || 1,
          status: 'pending' as AuditStatus,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Audit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
};

// Update an audit
export const useUpdateAudit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Audit> & { id: string }) => {
      const { data, error } = await supabase
        .from('audits')
        .update(updates as unknown as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Audit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['audit', data.id] });
    },
  });
};

// Delete an audit
export const useDeleteAudit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (auditId: string) => {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', auditId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
};

// Create findings (bulk)
export const useCreateFindings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (findings: CreateFindingInput[]) => {
      const { data, error } = await supabase
        .from('findings')
        .insert(findings)
        .select();
      
      if (error) throw error;
      return data as Finding[];
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['findings', variables[0].audit_id] });
      }
    },
  });
};

// Toggle finding resolved status
export const useToggleFindingResolved = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_resolved, audit_id }: { id: string; is_resolved: boolean; audit_id: string }) => {
      const { data, error } = await supabase
        .from('findings')
        .update({ is_resolved })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { finding: data as Finding, audit_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['findings', data.audit_id] });
    },
  });
};
