import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PowerUpPurchase {
  id: string;
  user_id: string;
  nloc_amount: number;
  price_cents: number;
  purchased_at: string;
}

export interface SubscriptionChange {
  id: string;
  user_id: string;
  previous_plan: 'starter' | 'pro' | null;
  new_plan: 'starter' | 'pro';
  changed_at: string;
}

export type BillingEvent = 
  | { type: 'power_up'; data: PowerUpPurchase; date: string }
  | { type: 'subscription_change'; data: SubscriptionChange; date: string };

interface BillingHistoryOptions {
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  pageSize?: number;
}

export function usePowerUpPurchases(options: BillingHistoryOptions = {}) {
  const { user } = useAuth();
  const { startDate = null, endDate = null, page = 1, pageSize = 15 } = options;

  return useQuery({
    queryKey: ['power-up-purchases', user?.id, startDate, endDate, page, pageSize],
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };
      
      let query = supabase
        .from('power_up_purchases')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (startDate) query = query.gte('purchased_at', startDate);
      if (endDate) query = query.lte('purchased_at', `${endDate}T23:59:59.999Z`);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as PowerUpPurchase[], count: count || 0 };
    },
    enabled: !!user?.id,
  });
}

export function useSubscriptionHistory(options: BillingHistoryOptions = {}) {
  const { user } = useAuth();
  const { startDate = null, endDate = null, page = 1, pageSize = 15 } = options;

  return useQuery({
    queryKey: ['subscription-history', user?.id, startDate, endDate, page, pageSize],
    queryFn: async () => {
      if (!user?.id) return { data: [], count: 0 };
      
      let query = supabase
        .from('subscription_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false });

      if (startDate) query = query.gte('changed_at', startDate);
      if (endDate) query = query.lte('changed_at', `${endDate}T23:59:59.999Z`);

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as SubscriptionChange[], count: count || 0 };
    },
    enabled: !!user?.id,
  });
}

export function useBillingHistory(options: BillingHistoryOptions = {}) {
  const { data: purchasesResult, isLoading: purchasesLoading } = usePowerUpPurchases(options);
  const { data: changesResult, isLoading: changesLoading } = useSubscriptionHistory(options);

  const isLoading = purchasesLoading || changesLoading;
  const purchases = purchasesResult?.data || [];
  const subscriptionChanges = changesResult?.data || [];
  const totalCount = (purchasesResult?.count || 0) + (changesResult?.count || 0);

  const events: BillingEvent[] = [];

  purchases.forEach(purchase => {
    events.push({ type: 'power_up', data: purchase, date: purchase.purchased_at });
  });

  subscriptionChanges.forEach(change => {
    events.push({ type: 'subscription_change', data: change, date: change.changed_at });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { events, isLoading, totalCount, purchases, subscriptionChanges };
}
