import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyWebhookSignature } from "../_shared/razorpaySignature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id",
};

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
                   payload.payload?.order?.entity;

    console.log(`Processing Razorpay webhook: ${event}`, { eventId });

    // Atomic idempotency guard: INSERT first, catch unique violation
    if (eventId) {
      const { error: idempotencyError } = await supabase
        .from("subscription_events")
        .insert({
          event_id: eventId,
          event_type: event,
          subscription_id: entity?.id || "unknown",
          status: "processing",
          raw_payload: payload,
        });

      if (idempotencyError) {
        if (idempotencyError.code === "23505") {
          console.log("Webhook already processed:", eventId);
          return new Response(
            JSON.stringify({ success: true, already_processed: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error("Failed to record webhook event:", idempotencyError.message);
        return new Response(
          JSON.stringify({ error: "Failed to record event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    switch (event) {
      case "payment.captured": {
        const rzOrderId = entity?.order_id;
        const paymentId = entity?.id;
        const amountCents = entity?.amount;
        const notes = entity?.notes || {};

        let order = null;

        if (rzOrderId) {
          const { data } = await supabase
            .from("payment_orders")
            .select("order_id, order_type, plan, user_id, metadata")
            .eq("rz_order_id", rzOrderId)
            .single();
          order = data;
        }

        if (!order && notes.reference_id) {
          const { data } = await supabase
            .from("payment_orders")
            .select("order_id, order_type, plan, user_id, metadata")
            .eq("order_id", notes.reference_id)
            .single();
          order = data;
        }

        if (order) {
          await supabase.rpc("process_payment_success", {
            p_order_id: order.order_id,
            p_cf_payment_id: paymentId,
          });

          if (order.order_type === "upgrade" && order.plan) {
            const metadata = order.metadata as Record<string, string> | null;
            const fromPlan = metadata?.from_plan || "starter";

            await supabase
              .from("subscriptions")
              .update({
                plan: order.plan,
                pending_plan: null,
                pending_plan_effective_date: null,
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", order.user_id);

            await supabase
              .from("subscription_history")
              .insert({
                user_id: order.user_id,
                previous_plan: fromPlan,
                new_plan: order.plan,
              });
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

      case "order.paid": {
        console.log("Order paid:", entity?.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event);
    }

    // Update final status for events that don't set it in their handler
    if (eventId) {
      await supabase
        .from("subscription_events")
        .update({
          status: "processed",
          payment_id: entity?.id,
          amount_cents: entity?.amount,
        })
        .eq("event_id", eventId)
        .eq("status", "processing"); // Only update if still in initial state
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
