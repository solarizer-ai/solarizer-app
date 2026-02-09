import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { BillingData } from "@/types/billing";
import { invokeWithRefresh } from "@/lib/sessionRefresh";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  handler?: (response: RazorpayResponse) => void;
  callback_url?: string;
  redirect?: boolean;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
  notes?: Record<string, string>;
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

interface CreateOrderParams {
  orderType: "subscription" | "power_up" | "upgrade";
  plan?: "launch" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  billingData?: BillingData;
  // For upgrades
  fromPlan?: string;
  toPlan?: string;
  prorationAmount?: number;
}

interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  rzOrderId: string;
  amountCents: number;
  currency: string;
  description: string;
  keyId: string;
  callbackUrl: string;
  error?: string;
}

export function useRazorpayCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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

      const { orderId, rzOrderId, amountCents, currency, description, keyId, callbackUrl } = data;

      // Check if Razorpay SDK is loaded
      if (typeof window.Razorpay === "undefined") {
        toast({
          title: "Payment System Error",
          description: "Payment system is not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return false;
      }

      // Open Razorpay Checkout with full-page redirect
      const options: RazorpayOptions = {
        key: keyId,
        order_id: rzOrderId,
        amount: amountCents,
        currency: currency,
        name: "Solarizer",
        description: description,
        callback_url: callbackUrl,
        redirect: true,
        prefill: {
          email: user?.email || session.user.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
      // In redirect mode, the page will navigate away
      // Return true since we initiated the checkout successfully
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
