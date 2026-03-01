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

interface UseCreditActivityOptions {
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  pageSize?: number;
}

export function useCreditActivity(options: UseCreditActivityOptions = {}) {
  const { user } = useAuth();
  const { startDate = null, endDate = null, page = 1, pageSize = 20 } = options;

  return useQuery({
    queryKey: ['credit-activity', user?.id, startDate, endDate, page, pageSize],
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };

      let query = supabase
        .from('credit_txns')
        .select('id, type, amount, balance_after, description, audit_id, created_at', { count: 'exact' })
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as CreditTransaction[], count: count || 0 };
    },
    enabled: !!user?.id,
  });
}
