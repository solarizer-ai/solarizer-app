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
  cfSubscriptionId?: string;
  authLink?: string;
  paymentSessionId?: string;
  prorationAmount?: number;
  prorationCents?: number;
  fromPlan?: string;
  toPlan?: string;
  flowType?: string;
  orderId?: string;
  error?: string;
  details?: unknown;
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

export function useCashfreeSubscription() {
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
        "cashfree-create-subscription",
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

      const { authLink } = data;
      
      if (authLink) {
        // Redirect to Cashfree for card authorization
        window.location.href = authLink;
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
        "cashfree-upgrade-subscription",
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

      const { authLink, flowType } = data;
      
      if (authLink) {
        // Redirect to Cashfree for payment
        window.location.href = authLink;
        return true;
      }

      // If flowType is proration_order, use the regular checkout flow
      if (flowType === "proration_order") {
        console.log("=== CASHFREE CHECKOUT DEBUG ===");
        console.log("Payment Session ID:", data.paymentSessionId);
        console.log("Full response:", data);
        
        if (!data.paymentSessionId) {
          console.error("Payment session ID missing from response:", data);
          toast({
            title: "Upgrade Error",
            description: "Payment session not initialized. Please contact support.",
            variant: "destructive",
          });
          return false;
        }

        const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
        console.log("SDK Mode:", cashfreeMode);
        
        if (typeof window.Cashfree !== "undefined") {
          try {
            const cashfree = new window.Cashfree({ mode: cashfreeMode });
            console.log("Calling Cashfree checkout with session ID:", data.paymentSessionId);
            await cashfree.checkout({
              paymentSessionId: data.paymentSessionId as unknown as string,
              redirectTarget: "_self",
            });
            return true;
          } catch (checkoutError) {
            console.error("Cashfree SDK checkout error:", checkoutError);
            toast({
              title: "Checkout Failed",
              description: "Unable to initialize payment. Please try again.",
              variant: "destructive",
            });
            return false;
          }
        } else {
          console.error("Cashfree SDK not loaded on window");
          toast({
            title: "Payment Error",
            description: "Payment system not loaded. Please refresh and try again.",
            variant: "destructive",
          });
          return false;
        }
      }

      toast({
        title: "Upgrade Error",
        description: "Payment link not available. Please try again.",
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
  const cancelSubscription = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeWithRefresh<CancelResponse>(
        "cashfree-cancel-subscription",
        { body: {} }
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
        description: `Your access will continue until ${new Date(data.accessUntil!).toLocaleDateString()}.`,
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

// Extend window interface for Cashfree SDK
declare global {
  interface Window {
    Cashfree: new (config: { mode: string }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => Promise<void>;
    };
  }
}
