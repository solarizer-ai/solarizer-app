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
  handler: (response: RazorpayResponse) => void;
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

      const { orderId, rzOrderId, amountCents, currency, description, keyId } = data;

      // Check if Razorpay SDK is loaded
      if (typeof window.Razorpay === "undefined") {
        toast({
          title: "Payment System Error",
          description: "Payment system is not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return false;
      }

      // Open Razorpay Checkout
      return new Promise<boolean>((resolve) => {
        const options: RazorpayOptions = {
          key: keyId,
          order_id: rzOrderId,
          amount: amountCents,
          currency: currency,
          name: "Solarizer",
          description: description,
          handler: async (response: RazorpayResponse) => {
            // Verify payment on server
            try {
              const { data: verifyResult, error: verifyError } = await invokeWithRefresh<{ success: boolean; error?: string }>(
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

              if (verifyError || !verifyResult?.success) {
                toast({
                  title: "Payment Verification Failed",
                  description: verifyResult?.error || "Please contact support.",
                  variant: "destructive",
                });
                setIsLoading(false);
                resolve(false);
                return;
              }

              // Redirect to success page
              window.location.href = `/payment-success?order_id=${orderId}`;
              resolve(true);
            } catch (err) {
              console.error("Payment verification error:", err);
              toast({
                title: "Payment Error",
                description: "Failed to verify payment. Please contact support.",
                variant: "destructive",
              });
              setIsLoading(false);
              resolve(false);
            }
          },
          prefill: {
            email: user?.email || session.user.email || "",
          },
          theme: {
            color: "#3B82F6", // Primary brand color
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              resolve(false);
            },
            escape: true,
            confirm_close: true,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
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
