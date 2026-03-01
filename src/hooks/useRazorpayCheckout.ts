import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

interface CreateOrderParams {
  orderType: "subscription" | "power_up";
  plan?: "starter" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  coupon_code?: string;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  paymentLinkId?: string;
  paymentUrl?: string;
  flowType?: string;
  amountCents: number;
  currency: string;
  description: string;
  error?: string;
}

export function useRazorpayCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = async (params: CreateOrderParams): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make a purchase.",
          variant: "destructive",
        });
        return false;
      }

      // Create payment link via edge function
      const { data, error } = await invokeWithRefresh<CreateOrderResponse>("razorpay-create-order", {
        body: params,
      });

      if (error || !data?.success) {
        if (import.meta.env.DEV) console.error("Create order error:", error || data?.error);
        toast({
          title: "Order Creation Failed",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      // Free checkout (100% coupon) — no redirect needed
      if (data.flowType === "free_checkout") {
        toast({
          title: "Purchase Complete",
          description: "Your credits have been added with the coupon discount!",
        });
        return true;
      }

      // Full-page redirect to Razorpay hosted checkout
      window.location.href = data.paymentUrl;
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { initiateCheckout, isLoading };
}
