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
  paymentLinkId: string;
  paymentUrl: string;
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
        console.error("Create order error:", error || data?.error);
        toast({
          title: "Order Creation Failed",
          description: data?.error || "Please try again later.",
          variant: "destructive",
        });
        return false;
      }

      // Full-page redirect to Razorpay hosted checkout
      // This navigates the user away from our site to Razorpay's payment page
      window.location.href = data.paymentUrl;
      
      // Return true since we successfully initiated the checkout
      // (the page will navigate away)
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
