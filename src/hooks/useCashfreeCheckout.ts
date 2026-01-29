import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { BillingData } from "@/types/billing";

declare global {
  interface Window {
    Cashfree: new (config: { mode: string }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => Promise<void>;
    };
  }
}

interface CreateOrderParams {
  orderType: "subscription" | "power_up";
  plan?: "launch" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  billingData?: BillingData;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  error?: string;
}

export function useCashfreeCheckout() {
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

      // Create order via edge function
      const response = await supabase.functions.invoke<CreateOrderResponse>("cashfree-create-order", {
        body: {
          ...params,
          returnUrl: window.location.origin,
        },
      });

      if (response.error || !response.data?.success) {
        console.error("Create order error:", response.error || response.data?.error);
        toast({
          title: "Order Creation Failed",
          description: response.data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      const { paymentSessionId } = response.data;

      // Check if Cashfree SDK is loaded
      if (typeof window.Cashfree === "undefined") {
        toast({
          title: "Payment System Error",
          description: "Payment system is not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return false;
      }

      // Initialize Cashfree and redirect to checkout
      const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
      const cashfree = new window.Cashfree({ mode: cashfreeMode });
      
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

      return true;
    } catch (error) {
      console.error("Checkout error:", error);
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
