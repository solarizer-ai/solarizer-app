import { useMutation } from "@tanstack/react-query";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface RunAuditParams {
  audit_id: string;
  project_name: string;
  files: { name: string; content: string }[];
  scope?: string[];  // In-scope file names for audit
  additional_context?: string;
  metadata: {
    nloc_count: number;
    contract_count: number;
    plan: 'starter' | 'pro';
  };
}

interface Finding {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  location?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  remediation?: string;
}

// New response type for fire-and-forget
interface AuditStartedResult {
  status: 'started';
  audit_id: string;
  message: string;
}

// Legacy result type (kept for reference)
interface AuditResult {
  security_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'secured' | 'issues';
  findings: Finding[];
}

export const useRunAudit = () => {
  return useMutation({
    mutationFn: async (params: RunAuditParams): Promise<AuditStartedResult> => {
      const { data, error } = await invokeWithRefresh<AuditStartedResult>('run-audit', {
        body: params,
      });

      if (error) {
        throw error;
      }

      return data as AuditStartedResult;
    },
  });
};

export type { RunAuditParams, AuditResult, AuditStartedResult, Finding };
