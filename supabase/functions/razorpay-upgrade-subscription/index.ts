import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpgradeSubscriptionRequest {
  toPlan: "starter" | "pro" | "business";
  coupon_code?: string;
}

// Plan prices in cents (USD)
const PLAN_PRICES: Record<string, number> = {
  starter: 14900, // $149 (Launch plan)
  pro: 19900, // $199
  business: 49900, // $499
};

// Plan order for validation
const PLAN_ORDER: Record<string, number> = {
  starter: 0,
  pro: 1,
  business: 2,
};

// M2: Use env var instead of hardcoded URL
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://solarizer-app.lovable.app";

function getRazorpayAuth(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return "Basic " + btoa(`${keyId}:${keySecret}`);
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

    const body: UpgradeSubscriptionRequest = await req.json();
    const { toPlan, coupon_code } = body;

    if (!toPlan || !PLAN_PRICES[toPlan]) {
      return new Response(
        JSON.stringify({ error: "Invalid target plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, current_period_start, current_period_end, rz_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromPlan = subscription.plan;

    // Validate upgrade (must be to a higher tier)
    if (PLAN_ORDER[toPlan] <= PLAN_ORDER[fromPlan]) {
      return new Response(
        JSON.stringify({ error: "Can only upgrade to a higher tier plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate full price difference (no time-based proration)
    const upgradeAmount = (PLAN_PRICES[toPlan] || 0) - (PLAN_PRICES[fromPlan] || 0);

    // Apply coupon if provided
    let couponId: string | undefined;
    let finalAmount = upgradeAmount;

    if (coupon_code) {
      const { data: couponResult, error: couponError } = await supabase.rpc("validate_coupon", {
        p_code: coupon_code.toUpperCase().trim(),
        p_order_type: "subscription",
        p_amount_cents: upgradeAmount,
      });

      if (!couponError && couponResult?.valid) {
        couponId = couponResult.coupon_id;
        finalAmount = couponResult.final_amount_cents;
        console.log("Coupon applied to upgrade:", coupon_code, "discount:", upgradeAmount - finalAmount);
      } else {
        console.warn("Invalid coupon for upgrade, ignoring:", coupon_code);
      }
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // If amount is 0 or very small, just upgrade directly
    if (finalAmount < 100) { // Less than $1
      await adminSupabase
        .from("subscriptions")
        .update({
          plan: toPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          flowType: "direct_upgrade",
          message: "Plan upgraded successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Payment Link (same approach as power-ups)
    const orderId = `upgrade_${Date.now()}_${user.id.slice(0, 8)}`;
    const callbackUrl = `${FRONTEND_URL}/payment-success`;

    const planDisplayName = toPlan.charAt(0).toUpperCase() + toPlan.slice(1);

    const rzResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency: "USD",
        reference_id: orderId,
        description: `Upgrade to ${planDisplayName} Plan`,
        callback_url: callbackUrl,
        callback_method: "get",
        notes: {
          user_id: user.id,
          order_type: "upgrade",
          from_plan: fromPlan,
          to_plan: toPlan,
        },
      }),
    });

    if (!rzResponse.ok) {
      const errorText = await rzResponse.text();
      console.error("Razorpay create payment link error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create upgrade payment link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzPaymentLink = await rzResponse.json();

    // Store the upgrade order
    await adminSupabase.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: "upgrade",
      p_amount_cents: finalAmount,
      p_payment_session_id: rzPaymentLink.id,
      p_plan: toPlan,
      p_billing_period: "monthly",
      p_credits_amount: null,
    });

    const metadata: Record<string, any> = {
      from_plan: fromPlan,
      to_plan: toPlan,
    };
    if (couponId) {
      metadata.coupon_id = couponId;
      metadata.original_amount_cents = upgradeAmount;
    }

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_link_id: rzPaymentLink.id,
        metadata,
      })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        flowType: "proration_order",
        paymentUrl: rzPaymentLink.short_url,
        orderId,
        upgradeAmount: finalAmount,
        originalAmount: upgradeAmount,
        fromPlan,
        toPlan,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
