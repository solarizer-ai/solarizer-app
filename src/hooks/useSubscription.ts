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

// Response type for server-side credit operations
interface CreditOperationResponse {
  success: boolean;
  error?: string;
  credits_remaining?: number;
  credits_used_this_period?: number;
  scans_remaining?: number;
  nloc_added?: number;
  required?: number;
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

      // Call the secure server-side function for credit deduction
      const { data, error } = await supabase.rpc('deduct_credits', {
        p_nloc_amount: nlocAmount,
        p_is_starter: plan === 'starter',
      });

      if (error) throw error;
      
      const result = data as unknown as CreditOperationResponse;
      
      // Check if the operation was successful
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to deduct credits');
      }

      return result;
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

      // Call the secure server-side function for power-up purchase
      const { data, error } = await supabase.rpc('purchase_power_up', {
        p_nloc_amount: nlocAmount,
        p_price_cents: priceCents,
      });

      if (error) throw error;
      
      const result = data as unknown as CreditOperationResponse;
      
      // Check if the operation was successful
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to purchase power-up');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nloc-credits', user?.id] });
    },
  });
}
