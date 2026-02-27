import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePublicAudit = (slug: string | null) => {
  return useQuery({
    queryKey: ["public-audit", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const usePublicFindings = (auditId: string | null) => {
  return useQuery({
    queryKey: ["public-findings", auditId],
    queryFn: async () => {
      if (!auditId) return [];
      const { data, error } = await supabase
        .from("findings")
        .select("*")
        .eq("audit_id", auditId)
        .not("verification_status", "eq", "false_positive")
        .order("severity", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!auditId,
  });
};
