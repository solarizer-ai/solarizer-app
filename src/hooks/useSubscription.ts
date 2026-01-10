import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionPlan = 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface NlocCredits {
  id: string;
  user_id: string;
  credits_remaining: number;
  scans_remaining: number;
  credits_used_this_period: number;
  period_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No subscription found
        throw error;
      }

      return data as Subscription;
    },
    enabled: !!user?.id,
  });
}

export function useCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['nloc-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('nloc_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as NlocCredits;
    },
    enabled: !!user?.id,
  });
}

// useScanCount removed - now using scans_remaining from nloc_credits

export function useDeductCredits() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ nlocAmount, plan }: { nlocAmount: number; plan: SubscriptionPlan }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get current credits
      const { data: currentCredits, error: fetchError } = await supabase
        .from('nloc_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const newRemaining = Math.max(0, (currentCredits?.credits_remaining || 0) - nlocAmount);
      const newUsed = (currentCredits?.credits_used_this_period || 0) + nlocAmount;

      // Build update object
      const updates: Record<string, number> = {
        credits_remaining: newRemaining,
        credits_used_this_period: newUsed,
      };

      // Starter users also deduct scan count
      if (plan === 'starter') {
        updates.scans_remaining = Math.max(0, (currentCredits?.scans_remaining || 0) - 1);
      }

      const { data, error } = await supabase
        .from('nloc_credits')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nloc-credits', user?.id] });
    },
  });
}

export function usePurchasePowerUp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ nlocAmount, priceCents }: { nlocAmount: number; priceCents: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('power_up_purchases')
        .insert({
          user_id: user.id,
          nloc_amount: nlocAmount,
          price_cents: priceCents,
        });

      if (purchaseError) throw purchaseError;

      // Get current credits
      const { data: currentCredits, error: fetchError } = await supabase
        .from('nloc_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Add credits
      const { data, error } = await supabase
        .from('nloc_credits')
        .update({
          credits_remaining: (currentCredits?.credits_remaining || 0) + nlocAmount,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nloc-credits', user?.id] });
    },
  });
}
