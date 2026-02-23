import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyPaymentLinkSignature } from "../_shared/razorpaySignature.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentLinkRequest {
  razorpay_payment_id: string;
  razorpay_payment_link_id: string;
  razorpay_payment_link_reference_id: string;
  razorpay_payment_link_status: string;
  razorpay_signature: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: VerifyPaymentLinkRequest = await req.json();
    const { 
      razorpay_payment_id, 
      razorpay_payment_link_id, 
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_signature 
    } = body;

    const orderId = razorpay_payment_link_reference_id;

    if (!orderId || !razorpay_payment_link_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Idempotency check
    const { data: existingOrder } = await adminSupabase
      .from("payment_orders")
      .select("status, rz_payment_id, order_type, plan, billing_period, credits_amount, amount_cents, metadata")
      .eq("order_id", orderId)
      .single();

    if (existingOrder?.status === 'paid') {
      if (existingOrder.order_type === 'upgrade' && existingOrder.plan) {
        const { data: currentSub } = await adminSupabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", user.id)
          .single();

        if (currentSub && currentSub.plan !== existingOrder.plan) {
          const metadata = existingOrder.metadata as Record<string, string> | null;
          const fromPlan = metadata?.from_plan || currentSub.plan;

          await adminSupabase
            .from("subscriptions")
            .update({
              plan: existingOrder.plan,
              pending_plan: null,
              pending_plan_effective_date: null,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          await adminSupabase
            .from("subscription_history")
            .insert({
              user_id: user.id,
              previous_plan: fromPlan,
              new_plan: existingOrder.plan,
            });
        }
      }

      const { data: credits } = await adminSupabase
        .from("nloc_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          already_processed: true,
          status: "paid",
          orderType: existingOrder.order_type,
          plan: existingOrder.plan,
          billingPeriod: existingOrder.billing_period,
          creditsAmount: existingOrder.credits_amount,
          amountCents: existingOrder.amount_cents,
          creditsRemaining: credits?.credits_remaining || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the signature (timing-safe via shared module)
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyPaymentLinkSignature(
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error("Invalid payment signature for order:", orderId);
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_id: razorpay_payment_id,
        rz_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    const { data: orderInfo } = await adminSupabase
      .from("payment_orders")
      .select("order_type, plan, metadata")
      .eq("order_id", orderId)
      .single();

    const { data: result, error: processError } = await adminSupabase.rpc(
      "process_payment_success",
      {
        p_order_id: orderId,
        p_cf_payment_id: razorpay_payment_id,
      }
    );

    if (processError) {
      console.error("Error processing payment:", processError);
      return new Response(
        JSON.stringify({ error: "Failed to process payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (orderInfo?.order_type === "upgrade" && orderInfo?.plan) {
      const metadata = orderInfo.metadata as Record<string, string> | null;
      const fromPlan = metadata?.from_plan || "starter";

      await adminSupabase
        .from("subscriptions")
        .update({
          plan: orderInfo.plan,
          pending_plan: null,
          pending_plan_effective_date: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await adminSupabase
        .from("subscription_history")
        .insert({
          user_id: user.id,
          previous_plan: fromPlan,
          new_plan: orderInfo.plan,
        });
    }

    const { data: credits } = await adminSupabase
      .from("nloc_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .single();

    const { data: orderDetails } = await adminSupabase
      .from("payment_orders")
      .select("order_type, plan, billing_period, credits_amount, amount_cents")
      .eq("order_id", orderId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        status: "paid",
        orderType: orderDetails?.order_type,
        plan: orderDetails?.plan,
        billingPeriod: orderDetails?.billing_period,
        creditsAmount: orderDetails?.credits_amount,
        amountCents: orderDetails?.amount_cents ?? 0,
        creditsRemaining: credits?.credits_remaining || 0,
        ...result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
