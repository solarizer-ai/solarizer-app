import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface CreateSubscriptionParams {
  plan: "starter" | "pro" | "business";
  billingPeriod: "monthly";
}

interface UpgradeParams {
  toPlan: "pro" | "business";
}

interface SubscriptionResponse {
  success: boolean;
  subscriptionId?: string;
  shortUrl?: string;
  status?: string;
  flowType?: string;
  paymentUrl?: string;
  orderId?: string;
  prorationAmount?: number;
  fromPlan?: string;
  toPlan?: string;
  error?: string;
}

interface ScheduleDowngradeResponse {
  success: boolean;
  effective_date?: string;
  target_plan?: string;
  current_plan?: string;
  error?: string;
}

interface CancelResponse {
  success: boolean;
  message?: string;
  accessUntil?: string;
  error?: string;
}

export function useRazorpaySubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create a new subscription (first-time subscribers)
  const createSubscription = async (params: CreateSubscriptionParams): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await invokeWithRefresh<SubscriptionResponse>(
        "razorpay-create-subscription",
        { body: params }
      );

      if (error || !data?.success) {
        console.error("Create subscription error:", error || data?.error);
        toast({
          title: "Subscription Failed",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      const { shortUrl } = data;
      
      if (shortUrl) {
        // Redirect to Razorpay subscription page for card authorization
        window.location.href = shortUrl;
        return true;
      }

      toast({
        title: "Subscription Error",
        description: "No authorization link received. Please try again.",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Upgrade to a higher tier
  const upgradeSubscription = async (params: UpgradeParams): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await invokeWithRefresh<SubscriptionResponse>(
        "razorpay-upgrade-subscription",
        { body: params }
      );

      if (error || !data?.success) {
        console.error("Upgrade error:", error || data?.error);
        toast({
          title: "Upgrade Failed",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      // If direct upgrade (no payment needed)
      if (data.flowType === "direct_upgrade") {
        toast({
          title: "Upgrade Successful",
          description: "Your plan has been upgraded!",
        });
        queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
        return true;
      }

      // If proration order required, redirect to Payment Link
      if (data.flowType === "proration_order" && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return true;
      }

      toast({
        title: "Upgrade Error",
        description: "Payment not available. Please try again.",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Upgrade error:", error);
      toast({
        title: "Upgrade Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule a downgrade (takes effect at period end)
  const scheduleDowngrade = useMutation({
    mutationFn: async (targetPlan: string): Promise<ScheduleDowngradeResponse> => {
      const { data, error } = await supabase.rpc("schedule_downgrade", {
        p_target_plan: targetPlan,
      });

      if (error) throw error;
      return data as unknown as ScheduleDowngradeResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Downgrade Scheduled",
          description: `Your plan will change to ${data.target_plan} on ${new Date(data.effective_date!).toLocaleDateString()}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      } else {
        toast({
          title: "Downgrade Failed",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Downgrade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel pending downgrade
  const cancelPendingDowngrade = useMutation({
    mutationFn: async (): Promise<{ success: boolean; error?: string }> => {
      const { data, error } = await supabase.rpc("cancel_pending_downgrade");
      if (error) throw error;
      return data as unknown as { success: boolean; error?: string };
    },
    onSuccess: () => {
      toast({
        title: "Downgrade Cancelled",
        description: "Your plan will remain unchanged.",
      });
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel Downgrade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel subscription at period end
  const cancelSubscription = async (cancelImmediately = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeWithRefresh<CancelResponse>(
        "razorpay-cancel-subscription",
        { body: { cancelImmediately } }
      );

      if (error || !data?.success) {
        toast({
          title: "Cancellation Failed",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Subscription Cancelled",
        description: data.accessUntil 
          ? `Your access will continue until ${new Date(data.accessUntil).toLocaleDateString()}.`
          : data.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      return true;
    } catch (error) {
      console.error("Cancellation error:", error);
      toast({
        title: "Cancellation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reactivate subscription
  const reactivateSubscription = useMutation({
    mutationFn: async (): Promise<{ success: boolean; error?: string }> => {
      const { data, error } = await supabase.rpc("reactivate_subscription");
      if (error) throw error;
      return data as unknown as { success: boolean; error?: string };
    },
    onSuccess: () => {
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription will continue as normal.",
      });
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createSubscription,
    upgradeSubscription,
    scheduleDowngrade: scheduleDowngrade.mutate,
    cancelPendingDowngrade: cancelPendingDowngrade.mutate,
    cancelSubscription,
    reactivateSubscription: reactivateSubscription.mutate,
    isLoading,
    isSchedulingDowngrade: scheduleDowngrade.isPending,
    isCancellingDowngrade: cancelPendingDowngrade.isPending,
    isReactivating: reactivateSubscription.isPending,
  };
}
