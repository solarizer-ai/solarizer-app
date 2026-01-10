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

export function usePowerUpPurchases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['power-up-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('power_up_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data as PowerUpPurchase[];
    },
    enabled: !!user?.id,
  });
}

export function useSubscriptionHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data as SubscriptionChange[];
    },
    enabled: !!user?.id,
  });
}

export function useBillingHistory() {
  const { data: purchases, isLoading: purchasesLoading } = usePowerUpPurchases();
  const { data: subscriptionChanges, isLoading: changesLoading } = useSubscriptionHistory();

  const isLoading = purchasesLoading || changesLoading;

  // Combine and sort all billing events
  const events: BillingEvent[] = [];

  if (purchases) {
    purchases.forEach(purchase => {
      events.push({
        type: 'power_up',
        data: purchase,
        date: purchase.purchased_at,
      });
    });
  }

  if (subscriptionChanges) {
    subscriptionChanges.forEach(change => {
      events.push({
        type: 'subscription_change',
        data: change,
        date: change.changed_at,
      });
    });
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    events,
    isLoading,
    purchases,
    subscriptionChanges,
  };
}
