import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminRole() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-role", user?.id],
    queryFn: async () => {
      if (!user) return { role: null };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return { role: null };
      return { role: data?.role ?? null };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isAdmin: data?.role === "admin",
    isLoading,
  };
}
