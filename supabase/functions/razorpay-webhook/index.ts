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

      // M4: Store subscription ID on .authenticated using notes.user_id
      case "subscription.authenticated": {
        const subscriptionId = entity?.id;
        const notes = entity?.notes || {};
        console.log("Subscription authenticated:", subscriptionId);

        if (subscriptionId && notes.user_id) {
          await supabase
            .from("subscriptions")
            .update({
              rz_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", notes.user_id);
        }
        break;
      }

      case "subscription.activated": {
        const subscriptionId = entity?.id;
        const planId = entity?.plan_id;
        const notes = entity?.notes || {};

        // H1: Read billing period dates from the Razorpay entity
        const currentStart = entity?.current_start
          ? new Date(entity.current_start * 1000).toISOString()
          : new Date().toISOString();
        const currentEnd = entity?.current_end
          ? new Date(entity.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              rz_subscription_id: subscriptionId,
              rz_plan_id: planId,
              current_period_start: currentStart,
              current_period_end: currentEnd,
              payment_method_saved: true,
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);

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

      // C1: Inline renewal logic (process_subscription_renewal RPC was dropped)
      case "subscription.charged": {
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

          // Look up subscription to get user_id
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("user_id, plan")
            .eq("rz_subscription_id", subscriptionId)
            .single();

          if (subscription) {
            // Credit the user's account (50 credits for monthly renewal)
            const creditsToAdd = 50;
            
            // Upsert credits
            const { error: creditError } = await supabase
              .from("nloc_credits")
              .update({
                credits_remaining: supabase.rpc ? undefined : 0, // handled below
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subscription.user_id);

            // Use raw SQL-style increment via direct update
            // Since we can't do atomic increment via update, use the RPC pattern
            const { data: currentCredits } = await supabase
              .from("nloc_credits")
              .select("credits_remaining")
              .eq("user_id", subscription.user_id)
              .single();

            if (currentCredits) {
              await supabase
                .from("nloc_credits")
                .update({
                  credits_remaining: currentCredits.credits_remaining + creditsToAdd,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", subscription.user_id);
            }

            // Log the credit transaction
            const { data: balanceAfter } = await supabase
              .from("nloc_credits")
              .select("credits_remaining")
              .eq("user_id", subscription.user_id)
              .single();

            await supabase.from("credit_txns").insert({
              user_id: subscription.user_id,
              type: "subscription_grant",
              amount: creditsToAdd,
              balance_after: balanceAfter?.credits_remaining || 0,
              description: `Monthly renewal (${subscription.plan} plan)`,
            });
          }

          // H1: Read billing period dates from the Razorpay subscription entity
          const subEntity = payload.payload?.subscription?.entity;
          const currentStart = subEntity?.current_start
            ? new Date(subEntity.current_start * 1000).toISOString()
            : new Date().toISOString();
          const currentEnd = subEntity?.current_end
            ? new Date(subEntity.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          // Extend period
          await supabase
            .from("subscriptions")
            .update({
              current_period_start: currentStart,
              current_period_end: currentEnd,
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);
        }
        break;
      }

      case "subscription.pending": {
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

      // M3: New handlers for subscription.completed and subscription.updated
      case "subscription.completed": {
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
            status: "completed",
            raw_payload: payload,
          });
        }
        break;
      }

      case "subscription.updated": {
        const subscriptionId = entity?.id;
        const planId = entity?.plan_id;
        if (subscriptionId && planId) {
          await supabase
            .from("subscriptions")
            .update({
              rz_plan_id: planId,
              updated_at: new Date().toISOString(),
            })
            .eq("rz_subscription_id", subscriptionId);
        }

        await supabase.from("subscription_events").insert({
          event_id: eventId,
          subscription_id: subscriptionId || "unknown",
          event_type: event,
          status: "updated",
          raw_payload: payload,
        });
        break;
      }

      case "order.paid": {
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
