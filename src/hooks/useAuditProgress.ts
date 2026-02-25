import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditOrchestrationProgress {
  session_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  phase: string;
  progress: {
    currentContract?: string;
    contractIndex?: number;
    contractTotal?: number;
    contractProgress?: Record<string, { done: boolean; error?: string }>;
    subPhase?: string;
    crossContractPass?: number;
    crossContractTotal?: number;
  };
  findings_count: number;
  error: string | null;
  started_at: string;
  updated_at: string;
  request_payload?: {
    scopeFiles?: unknown;
    contextFiles?: unknown;
    [key: string]: unknown;
  };
}

export function useAuditProgress(auditId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["audit-progress", auditId],
    queryFn: async (): Promise<AuditOrchestrationProgress | null> => {
      if (!auditId) return null;

      const { data, error } = await supabase
        .from("audit_orchestration")
        .select("session_id, status, phase, progress, findings_count, error, started_at, updated_at, request_payload")
        .eq("session_id", auditId)
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as AuditOrchestrationProgress;
    },
    enabled: !!auditId && enabled,
    refetchInterval: 2000,
  });
}
