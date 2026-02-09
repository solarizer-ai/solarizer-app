import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpgradeSubscriptionRequest {
  toPlan: "starter" | "pro" | "business";
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
  launch: 1,
  pro: 2,
  business: 3,
};

function getRazorpayAuth(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return "Basic " + btoa(`${keyId}:${keySecret}`);
}

function calculateProration(
  fromPlan: string,
  toPlan: string,
  daysRemaining: number,
  totalDays: number
): number {
  const fromPrice = PLAN_PRICES[fromPlan] || 0;
  const toPrice = PLAN_PRICES[toPlan] || 0;
  const priceDifference = toPrice - fromPrice;
  
  // Prorate based on remaining days in the cycle
  const prorationAmount = Math.ceil((priceDifference * daysRemaining) / totalDays);
  return Math.max(prorationAmount, 0);
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
    const { toPlan } = body;

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

    // Calculate proration
    const now = new Date();
    const periodStart = new Date(subscription.current_period_start);
    const periodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end)
      : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const prorationAmount = calculateProration(fromPlan, toPlan, daysRemaining, totalDays);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // If proration amount is 0 or very small, just upgrade directly
    if (prorationAmount < 100) { // Less than $1
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
    const callbackUrl = Deno.env.get("SUPABASE_URL")?.includes("localhost")
      ? "http://localhost:5173/payment-success"
      : "https://solarizer-app.lovable.app/payment-success";

    const planDisplayName = toPlan.charAt(0).toUpperCase() + toPlan.slice(1);

    const rzResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: prorationAmount,
        currency: "USD",
        reference_id: orderId,
        description: `Upgrade to ${planDisplayName} Plan (prorated)`,
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
      p_amount_cents: prorationAmount,
      p_payment_session_id: rzPaymentLink.id,
      p_plan: toPlan,
      p_billing_period: "monthly",
      p_credits_amount: null,
    });

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_link_id: rzPaymentLink.id,
        metadata: {
          from_plan: fromPlan,
          to_plan: toPlan,
          proration_days: daysRemaining,
        },
      })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        flowType: "proration_order",
        paymentUrl: rzPaymentLink.short_url,
        orderId,
        prorationAmount,
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
