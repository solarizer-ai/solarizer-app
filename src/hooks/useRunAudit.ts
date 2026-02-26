import { useMutation } from "@tanstack/react-query";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface RunAuditParams {
  projectName: string;
  files: { name: string; content: string }[];
  scope: string[];
  additionalContext?: string;
}

interface AuditStartedResult {
  sessionId: string;
}

export const useRunAudit = () => {
  return useMutation({
    mutationFn: async (params: RunAuditParams): Promise<AuditStartedResult> => {
      const { data, error } = await invokeWithRefresh<AuditStartedResult>('web-audit-start', {
        body: {
          projectName: params.projectName,
          files: params.files,
          scope: params.scope,
          additionalContext: params.additionalContext,
        },
      });

      if (error) throw error;
      if (!data?.sessionId) throw new Error('No sessionId returned from server');
      return data;
    },
  });
};

export type { RunAuditParams, AuditStartedResult };
