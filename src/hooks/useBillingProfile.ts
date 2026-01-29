import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BillingProfile, BillingData } from "@/types/billing";

export function useBillingProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: billingProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["billing-profile", user?.id],
    queryFn: async (): Promise<BillingProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("billing_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching billing profile:", error);
        throw error;
      }

      return data as BillingProfile | null;
    },
    enabled: !!user?.id,
  });

  const saveBillingProfile = useMutation({
    mutationFn: async (data: BillingData): Promise<BillingProfile> => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if profile exists
      const { data: existing } = await supabase
        .from("billing_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing profile
        const { data: updated, error } = await supabase
          .from("billing_profiles")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return updated as BillingProfile;
      } else {
        // Insert new profile
        const { data: inserted, error } = await supabase
          .from("billing_profiles")
          .insert({
            user_id: user.id,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        return inserted as BillingProfile;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-profile", user?.id] });
    },
  });

  return {
    billingProfile,
    isLoading,
    error,
    saveBillingProfile: saveBillingProfile.mutateAsync,
    isSaving: saveBillingProfile.isPending,
  };
}
