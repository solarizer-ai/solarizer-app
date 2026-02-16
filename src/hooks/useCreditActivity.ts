import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  description: string | null;
  audit_id: string | null;
  created_at: string | null;
}

export function useCreditActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('credit_txns')
        .select('id, type, amount, balance_after, description, audit_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!user?.id,
  });
}
