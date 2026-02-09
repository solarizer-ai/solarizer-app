import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id",
};

async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );
  
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return computedSignature === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const signature = req.headers.get("x-razorpay-signature");
    const eventId = req.headers.get("x-razorpay-event-id");
    const rawBody = await req.text();

    if (!signature) {
      console.error("Missing webhook signature");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const entity = payload.payload?.payment?.entity || 
                   payload.payload?.subscription?.entity || 
                   payload.payload?.order?.entity;

    console.log(`Processing Razorpay webhook: ${event}`, { eventId });

    // Idempotency check
    if (eventId) {
      const { data: existing } = await supabase
        .from("subscription_events")
        .select("id")
        .eq("event_id", eventId)
        .single();

      if (existing) {
        console.log("Event already processed:", eventId);
        return new Response(
          JSON.stringify({ success: true, already_processed: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle different event types
    switch (event) {
      case "payment.captured": {
        // One-time payment captured
        const orderId = entity?.order_id;
        const paymentId = entity?.id;
        const amountCents = entity?.amount;

        if (orderId) {
          // Find our order by Razorpay order ID
          const { data: order } = await supabase
            .from("payment_orders")
            .select("order_id, order_type, plan, user_id")
            .eq("rz_order_id", orderId)
            .single();

          if (order) {
            // Process payment success
            await supabase.rpc("process_payment_success", {
              p_order_id: order.order_id,
              p_cf_payment_id: paymentId,
            });

            // For upgrade orders, update the plan
            if (order.order_type === "upgrade" && order.plan) {
              await supabase
                .from("subscriptions")
                .update({
                  plan: order.plan,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", order.user_id);
            }
          }
        }
        break;
      }

      case "payment.failed": {
        const orderId = entity?.order_id;
        if (orderId) {
          const { data: order } = await supabase
            .from("payment_orders")
            .select("order_id")
            .eq("rz_order_id", orderId)
            .single();

          if (order) {
            await supabase.rpc("mark_payment_failed", {
              p_order_id: order.order_id,
            });
          }
        }
        break;
      }

      case "subscription.authenticated": {
        // First auth payment done, subscription is being set up
        const subscriptionId = entity?.id;
        console.log("Subscription authenticated:", subscriptionId);
        break;
      }

      case "subscription.activated": {
        // Subscription is now active
        const subscriptionId = entity?.id;
        const planId = entity?.plan_id;
        const notes = entity?.notes || {};

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              rz_subscription_id: subscriptionId,
              rz_plan_id: planId,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              payment_method_saved: true,
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);

          // Determine plan from notes or plan_id
          const planName = notes.plan || "starter";
          if (notes.user_id) {
            await supabase
              .from("subscriptions")
              .update({ plan: planName })
              .eq("user_id", notes.user_id);
          }
        }
        break;
      }

      case "subscription.charged": {
        // Renewal payment successful
        const subscriptionId = entity?.id;
        const paymentId = payload.payload?.payment?.entity?.id;
        const amountCents = payload.payload?.payment?.entity?.amount;

        if (subscriptionId) {
          // Log the event
          await supabase.from("subscription_events").insert({
            event_id: eventId,
            subscription_id: subscriptionId,
            event_type: event,
            payment_id: paymentId,
            amount_cents: amountCents,
            status: "processed",
            raw_payload: payload,
          });

          // Process renewal using existing RPC
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("cf_subscription_id")
            .eq("rz_subscription_id", subscriptionId)
            .single();

          if (subscription) {
            // Use the Razorpay subscription ID for the renewal
            await supabase.rpc("process_subscription_renewal", {
              p_cf_subscription_id: subscriptionId,
              p_cf_payment_id: paymentId,
              p_amount_inr: amountCents,
            });
          }

          // Extend period
          await supabase
            .from("subscriptions")
            .update({
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);
        }
        break;
      }

      case "subscription.pending": {
        // Payment retry in progress
        const subscriptionId = entity?.id;
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);
        }
        break;
      }

      case "subscription.halted": {
        // All retries failed
        const subscriptionId = entity?.id;
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);

          await supabase.from("subscription_events").insert({
            event_id: eventId,
            subscription_id: subscriptionId,
            event_type: event,
            status: "halted",
            raw_payload: payload,
          });
        }
        break;
      }

      case "subscription.cancelled": {
        const subscriptionId = entity?.id;
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);

          await supabase.from("subscription_events").insert({
            event_id: eventId,
            subscription_id: subscriptionId,
            event_type: event,
            status: "cancelled",
            raw_payload: payload,
          });
        }
        break;
      }

      case "subscription.paused": {
        const subscriptionId = entity?.id;
        console.log("Subscription paused:", subscriptionId);
        await supabase.from("subscription_events").insert({
          event_id: eventId,
          subscription_id: subscriptionId,
          event_type: event,
          status: "paused",
          raw_payload: payload,
        });
        break;
      }

      case "subscription.resumed": {
        const subscriptionId = entity?.id;
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);
        }
        break;
      }

      case "order.paid": {
        // Backup confirmation for order payment
        console.log("Order paid:", entity?.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event);
    }

    // Log event for non-subscription events
    if (!event.startsWith("subscription.") && eventId) {
      await supabase.from("subscription_events").insert({
        event_id: eventId,
        subscription_id: entity?.id || "unknown",
        event_type: event,
        payment_id: entity?.id,
        amount_cents: entity?.amount,
        status: "logged",
        raw_payload: payload,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
