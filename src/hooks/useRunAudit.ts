import { useMutation } from "@tanstack/react-query";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface RunAuditParams {
  projectName: string;
  files: { name: string; content: string }[];
  scope: string[];
  additionalContext?: string;
  isStagingMode?: boolean;
}

interface AuditStartedResult {
  sessionId: string;
}

export const useRunAudit = () => {
  return useMutation({
    mutationFn: async (params: RunAuditParams): Promise<AuditStartedResult> => {
      const idempotency_key = crypto.randomUUID();
      const fnName = params.isStagingMode ? 'web-audit-start-rnd' : 'web-audit-start';

      const { data, error } = await invokeWithRefresh<AuditStartedResult>(fnName, {
        body: {
          projectName: params.projectName,
          files: params.files,
          scope: params.scope,
          additionalContext: params.additionalContext,
          idempotency_key,
        },
      });


      if (error) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed?.error) throw new Error(parsed.error);
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) throw error;
          throw parseErr;
        }
      }
      if (!data?.sessionId) throw new Error('No sessionId returned from server');
      return data;
    },
  });
};

export type { RunAuditParams, AuditStartedResult };
