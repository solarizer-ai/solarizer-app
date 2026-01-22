import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

// Verify Cashfree webhook signature
async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string
): Promise<boolean> {
  try {
    const message = timestamp + rawBody;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const computedSignature = base64Encode(new Uint8Array(signatureBuffer));
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    // Verify signature
    const isValid = await verifyWebhookSignature(rawBody, signature, timestamp, cashfreeSecretKey);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const data = payload.data;

    console.log("Webhook received:", eventType, JSON.stringify(data, null, 2));

    // ==================== PAYMENT EVENTS (One-time orders) ====================
    
    if (eventType === "PAYMENT_SUCCESS" || eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = data.order?.order_id;
      const cfPaymentId = data.payment?.cf_payment_id?.toString();

      if (!orderId || !cfPaymentId) {
        console.error("Missing order_id or cf_payment_id");
        return new Response(
          JSON.stringify({ error: "Missing order data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this is an upgrade order
      const { data: order } = await supabaseClient
        .from("payment_orders")
        .select("order_type, plan, billing_period, user_id")
        .eq("order_id", orderId)
        .single();

      if (order?.order_type === "upgrade") {
        // Handle upgrade completion - update plan immediately
        const { data: result, error } = await supabaseClient.rpc("process_upgrade_success", {
          p_user_id: order.user_id,
          p_new_plan: order.plan,
          p_new_cf_subscription_id: null, // Will be set when new subscription activates
          p_new_cf_plan_id: `solarizer_${order.plan}_${order.billing_period}`,
        });

        if (error) {
          console.error("Error processing upgrade:", error);
        } else {
          console.log("Upgrade processed:", result);
        }

        // Still process the payment order
        await supabaseClient.rpc("process_payment_success", {
          p_order_id: orderId,
          p_cf_payment_id: cfPaymentId,
        });

        return new Response(
          JSON.stringify({ success: true, type: "upgrade", result }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process regular payment with idempotency
      const { data: result, error } = await supabaseClient.rpc("process_payment_success", {
        p_order_id: orderId,
        p_cf_payment_id: cfPaymentId,
      });

      if (error) {
        console.error("Error processing payment:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment processed:", result);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eventType === "PAYMENT_FAILED" || eventType === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = data.order?.order_id;

      if (orderId) {
        await supabaseClient.rpc("mark_payment_failed", { p_order_id: orderId });
        console.log("Payment marked as failed:", orderId);
      }

      return new Response(
        JSON.stringify({ success: true, status: "failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==================== SUBSCRIPTION EVENTS ====================

    if (eventType === "SUBSCRIPTION_ACTIVATED" || eventType === "SUBSCRIPTION_NEW_ACTIVATION") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const customerId = data.customer_details?.customer_id || data.subscription?.customer_details?.customer_id;
      const planId = data.plan_details?.plan_id || data.subscription?.plan_details?.plan_id;
      
      if (!cfSubscriptionId || !customerId) {
        console.error("Missing subscription data:", { cfSubscriptionId, customerId });
        return new Response(
          JSON.stringify({ error: "Missing subscription data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract plan and billing period from plan_id (e.g., "solarizer_pro_monthly")
      let plan = "pro";
      let billingPeriod = "monthly";
      if (planId) {
        const parts = planId.split("_");
        if (parts.length >= 3) {
          plan = parts[1]; // "launch", "pro", or "business"
          billingPeriod = parts[2]; // "monthly" or "annual"
        }
      }

      // Activate subscription in database
      const { data: result, error } = await supabaseClient.rpc("activate_subscription", {
        p_user_id: customerId,
        p_cf_subscription_id: cfSubscriptionId,
        p_cf_plan_id: planId,
        p_billing_period: billingPeriod,
      });

      if (error) {
        console.error("Error activating subscription:", error);
        return new Response(
          JSON.stringify({ error: "Failed to activate subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the event
      await supabaseClient
        .from("cf_subscription_events")
        .insert({
          cf_subscription_id: cfSubscriptionId,
          event_type: eventType,
          status: "activated",
          raw_payload: payload,
        });

      console.log("Subscription activated:", result);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eventType === "SUBSCRIPTION_PAYMENT_SUCCESS" || eventType === "SUBSCRIPTION_CHARGED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const cfPaymentId = data.cf_payment_id?.toString() || data.payment?.cf_payment_id?.toString();
      const amountInr = data.subscription_amount || data.payment?.payment_amount;

      if (!cfSubscriptionId) {
        console.error("Missing cf_subscription_id for renewal");
        return new Response(
          JSON.stringify({ error: "Missing subscription ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process subscription renewal (handles credits, downgrade, cancellation)
      const { data: result, error } = await supabaseClient.rpc("process_subscription_renewal", {
        p_cf_subscription_id: cfSubscriptionId,
        p_cf_payment_id: cfPaymentId || `charge_${Date.now()}`,
        p_amount_inr: amountInr || null,
      });

      if (error) {
        console.error("Error processing subscription renewal:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process renewal" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Subscription renewal processed:", result);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eventType === "SUBSCRIPTION_PAYMENT_FAILED" || eventType === "SUBSCRIPTION_PAYMENT_DECLINED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const cfPaymentId = data.cf_payment_id?.toString() || data.payment?.cf_payment_id?.toString();

      if (cfSubscriptionId) {
        const { error } = await supabaseClient.rpc("handle_subscription_payment_failed", {
          p_cf_subscription_id: cfSubscriptionId,
          p_cf_payment_id: cfPaymentId || `failed_${Date.now()}`,
        });

        if (error) {
          console.error("Error handling payment failure:", error);
        } else {
          console.log("Subscription payment failed recorded:", cfSubscriptionId);
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: "payment_failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eventType === "SUBSCRIPTION_CANCELLED" || eventType === "SUBSCRIPTION_EXPIRED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;

      if (cfSubscriptionId) {
        // Log the event
        await supabaseClient
          .from("cf_subscription_events")
          .insert({
            cf_subscription_id: cfSubscriptionId,
            event_type: eventType,
            status: eventType.toLowerCase(),
            raw_payload: payload,
          });

        // Update subscription status if not already handled by cancellation flow
        const { data: sub } = await supabaseClient
          .from("subscriptions")
          .select("status")
          .eq("cf_subscription_id", cfSubscriptionId)
          .single();

        if (sub && sub.status !== "canceled") {
          await supabaseClient
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("cf_subscription_id", cfSubscriptionId);
        }

        console.log("Subscription cancelled/expired:", cfSubscriptionId);
      }

      return new Response(
        JSON.stringify({ success: true, status: eventType.toLowerCase() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other events, just acknowledge and log
    console.log("Unhandled event type:", eventType);
    return new Response(
      JSON.stringify({ success: true, message: "Event acknowledged", eventType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Cashfree from retrying for parsing errors
    return new Response(
      JSON.stringify({ error: "Webhook processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
