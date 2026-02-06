import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
  close: () => void;
}

interface CreateSubscriptionParams {
  plan: "launch" | "pro" | "business";
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
  // For proration upgrades
  flowType?: string;
  orderId?: string;
  rzOrderId?: string;
  prorationAmount?: number;
  fromPlan?: string;
  toPlan?: string;
  keyId?: string;
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

      const { flowType, rzOrderId, keyId, orderId, prorationAmount } = data;
      
      // If direct upgrade (no payment needed)
      if (flowType === "direct_upgrade") {
        toast({
          title: "Upgrade Successful",
          description: "Your plan has been upgraded!",
        });
        queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
        return true;
      }

      // If proration order required, open Razorpay checkout
      if (flowType === "proration_order" && rzOrderId && keyId) {
        if (typeof window.Razorpay === "undefined") {
          toast({
            title: "Payment Error",
            description: "Payment system not loaded. Please refresh and try again.",
            variant: "destructive",
          });
          return false;
        }

        return new Promise<boolean>((resolve) => {
          const options: RazorpayOptions = {
            key: keyId,
            order_id: rzOrderId,
            amount: prorationAmount || 0,
            currency: "USD",
            name: "Solarizer",
            description: `Upgrade to ${data.toPlan?.charAt(0).toUpperCase()}${data.toPlan?.slice(1)} Plan`,
            handler: async (response: RazorpayResponse) => {
              try {
                const { data: verifyResult } = await invokeWithRefresh<{ success: boolean }>(
                  "razorpay-verify-payment",
                  {
                    body: {
                      order_id: orderId,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    },
                  }
                );

                if (verifyResult?.success) {
                  toast({
                    title: "Upgrade Successful",
                    description: "Your plan has been upgraded!",
                  });
                  queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
                  resolve(true);
                } else {
                  toast({
                    title: "Upgrade Failed",
                    description: "Payment verification failed.",
                    variant: "destructive",
                  });
                  resolve(false);
                }
              } catch (err) {
                console.error("Upgrade verification error:", err);
                resolve(false);
              }
              setIsLoading(false);
            },
            prefill: {
              email: user?.email || session.user.email || "",
            },
            theme: {
              color: "#3B82F6",
            },
            modal: {
              ondismiss: () => {
                setIsLoading(false);
                resolve(false);
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        });
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
