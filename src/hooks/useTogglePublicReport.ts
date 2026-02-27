import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTogglePublicReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditId, isPublic }: { auditId: string; isPublic: boolean }) => {
      const { data, error } = await supabase.rpc("toggle_audit_public", {
        p_audit_id: auditId,
        p_is_public: isPublic,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["audit", variables.auditId] });
    },
  });
};
