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

    // ==================== REFUND EVENTS (Not Supported - Acknowledge Only) ====================
    
    if (eventType === "REFUND_WEBHOOK" || eventType === "SUBSCRIPTION_REFUND_STATUS") {
      console.log("Refund event received but not processed (refunds not supported):", eventType);
      return new Response(
        JSON.stringify({ success: true, message: "Refund events not processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==================== DISPUTE EVENTS (Log Only) ====================

    if (eventType === "DISPUTE_CREATED" || eventType === "DISPUTE_UPDATED" || eventType === "DISPUTE_CLOSED") {
      const orderId = data.order?.order_id;
      const disputeId = data.dispute?.dispute_id;
      const disputeStatus = data.dispute?.dispute_status;

      console.log(`Dispute ${eventType}:`, disputeId, "for order:", orderId, "status:", disputeStatus);

      // Log to cf_subscription_events for tracking (using cf_subscription_id as null placeholder)
      await supabaseClient
        .from("cf_subscription_events")
        .insert({
          cf_subscription_id: `dispute_${disputeId || orderId}`,
          event_type: eventType,
          status: disputeStatus || eventType.toLowerCase(),
          raw_payload: payload,
        });

      return new Response(
        JSON.stringify({ success: true, type: "dispute_logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==================== PAYMENT EVENTS (One-time orders) ====================
    
    // User dropped payment - treat as failed
    if (eventType === "PAYMENT_USER_DROPPED_WEBHOOK") {
      const orderId = data.order?.order_id;

      if (orderId) {
        await supabaseClient.rpc("mark_payment_failed", { p_order_id: orderId });
        console.log("Payment marked as failed (user dropped):", orderId);
      }

      return new Response(
        JSON.stringify({ success: true, status: "user_dropped_as_failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          p_new_cf_plan_id: `solarizer_${order.plan}_monthly_usd`,
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

    // Subscription Authorization Status (mandate activation)
    if (eventType === "SUBSCRIPTION_AUTH_STATUS" || eventType === "SUBSCRIPTION_ACTIVATED" || eventType === "SUBSCRIPTION_NEW_ACTIVATION") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const customerId = data.customer_details?.customer_id || data.subscription?.customer_details?.customer_id;
      const planId = data.plan_details?.plan_id || data.subscription?.plan_details?.plan_id;
      const authStatus = data.authorization_details?.authorization_status;
      const paymentStatus = data.payment_status;
      
      if (!cfSubscriptionId || !customerId) {
        console.error("Missing subscription data:", { cfSubscriptionId, customerId });
        return new Response(
          JSON.stringify({ error: "Missing subscription data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only activate if authorization was successful
      if (authStatus === "ACTIVE" || paymentStatus === "SUCCESS") {
        // Extract plan from plan_id (e.g., "solarizer_pro_monthly_usd")
        let plan = "pro";
        const billingPeriod = "monthly"; // Always monthly now
        if (planId) {
          const parts = planId.split("_");
          if (parts.length >= 2) {
            plan = parts[1]; // "launch", "pro", or "business"
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
      } else {
        // Log failed authorization
        console.log("Subscription authorization failed:", cfSubscriptionId, "authStatus:", authStatus, "paymentStatus:", paymentStatus);
        
        await supabaseClient
          .from("cf_subscription_events")
          .insert({
            cf_subscription_id: cfSubscriptionId,
            event_type: eventType,
            status: "authorization_failed",
            raw_payload: payload,
          });

        return new Response(
          JSON.stringify({ success: true, status: "authorization_failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Subscription Payment Success (renewals)
    if (eventType === "SUBSCRIPTION_PAYMENT_SUCCESS" || eventType === "SUBSCRIPTION_CHARGED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const cfPaymentId = data.cf_payment_id?.toString() || data.payment?.cf_payment_id?.toString();
      // Payment amount is now in USD (or whatever currency was used)
      const paymentAmount = data.subscription_amount || data.payment?.payment_amount;

      if (!cfSubscriptionId) {
        console.error("Missing cf_subscription_id for renewal");
        return new Response(
          JSON.stringify({ error: "Missing subscription ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process subscription renewal (handles credits, downgrade, cancellation)
      // Note: p_amount_inr param name kept for backward compatibility, but now receives USD
      const { data: result, error } = await supabaseClient.rpc("process_subscription_renewal", {
        p_cf_subscription_id: cfSubscriptionId,
        p_cf_payment_id: cfPaymentId || `charge_${Date.now()}`,
        p_amount_inr: paymentAmount || null,
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

    // Subscription Payment Failed
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

    // Subscription Payment Cancelled
    if (eventType === "SUBSCRIPTION_PAYMENT_CANCELLED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const cfPaymentId = data.cf_payment_id?.toString();

      if (cfSubscriptionId) {
        // Log the cancellation
        await supabaseClient.from("cf_subscription_events").insert({
          cf_subscription_id: cfSubscriptionId,
          event_type: eventType,
          cf_payment_id: cfPaymentId,
          status: "payment_cancelled",
          raw_payload: payload,
        });

        console.log("Subscription payment cancelled:", cfSubscriptionId);
      }

      return new Response(
        JSON.stringify({ success: true, status: "payment_cancelled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Subscription Status Changed (cancellation, expiry, pause, etc.)
    if (eventType === "SUBSCRIPTION_STATUS_CHANGED" || eventType === "SUBSCRIPTION_CANCELLED" || eventType === "SUBSCRIPTION_EXPIRED") {
      const cfSubscriptionId = data.subscription_details?.cf_subscription_id || data.cf_subscription_id || data.subscription?.cf_subscription_id;
      const newStatus = data.subscription_details?.subscription_status || data.subscription_status;

      if (cfSubscriptionId) {
        // Map Cashfree statuses to our internal statuses
        const statusMap: Record<string, string> = {
          "ACTIVE": "active",
          "CANCELLED": "canceled",
          "CUSTOMER_CANCELLED": "canceled",
          "EXPIRED": "canceled",
          "COMPLETED": "canceled",
          "ON_HOLD": "past_due",
          "CUSTOMER_PAUSED": "past_due", // Treat paused as past_due for now
          "BANK_APPROVAL_PENDING": "active", // Keep active while pending
        };

        const internalStatus = statusMap[newStatus] || "active";

        // Log the event first
        await supabaseClient
          .from("cf_subscription_events")
          .insert({
            cf_subscription_id: cfSubscriptionId,
            event_type: eventType,
            status: newStatus || eventType.toLowerCase(),
            raw_payload: payload,
          });

        // Update subscription status if it changed to a non-active state
        if (internalStatus !== "active") {
          await supabaseClient
            .from("subscriptions")
            .update({ status: internalStatus, updated_at: new Date().toISOString() })
            .eq("cf_subscription_id", cfSubscriptionId);
          
          console.log("Subscription status updated:", cfSubscriptionId, "->", internalStatus, "(from:", newStatus, ")");
        } else {
          console.log("Subscription status change logged:", cfSubscriptionId, "status:", newStatus);
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: eventType.toLowerCase() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Card Expiry Reminder (Log for future notification feature)
    if (eventType === "SUBSCRIPTION_CARD_EXPIRY_REMINDER") {
      const cfSubscriptionId = data.subscription_details?.cf_subscription_id || data.cf_subscription_id;
      const expiryDate = data.card_expiry_date || data.card_details?.card_expiry;

      if (cfSubscriptionId) {
        await supabaseClient.from("cf_subscription_events").insert({
          cf_subscription_id: cfSubscriptionId,
          event_type: eventType,
          status: "card_expiring",
          raw_payload: payload,
        });

        console.log("Card expiry reminder for subscription:", cfSubscriptionId, "expires:", expiryDate);
      }

      return new Response(
        JSON.stringify({ success: true, status: "card_expiry_logged" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment Notification Initiated (Log for tracking)
    if (eventType === "SUBSCRIPTION_PAYMENT_NOTIFICATION_INITIATED") {
      const cfSubscriptionId = data.cf_subscription_id || data.subscription?.cf_subscription_id;

      if (cfSubscriptionId) {
        await supabaseClient.from("cf_subscription_events").insert({
          cf_subscription_id: cfSubscriptionId,
          event_type: eventType,
          status: "notification_sent",
          raw_payload: payload,
        });

        console.log("Payment notification initiated for subscription:", cfSubscriptionId);
      }

      return new Response(
        JSON.stringify({ success: true, status: "notification_logged" }),
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
