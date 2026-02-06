import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpgradeSubscriptionRequest {
  toPlan: "pro" | "business";
}

// Plan prices in cents (USD)
const PLAN_PRICES: Record<string, number> = {
  launch: 14900, // $149
  pro: 19900, // $199
  business: 49900, // $499
  starter: 0,
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

    // If proration amount is 0 or very small, just upgrade directly
    if (prorationAmount < 100) { // Less than $1
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

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

    // Create a proration order for the difference
    const orderId = `upgrade_${Date.now()}_${user.id.slice(0, 8)}`;

    const rzResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: prorationAmount,
        currency: "USD",
        receipt: orderId,
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
      console.error("Razorpay create upgrade order error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create upgrade order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzOrder = await rzResponse.json();

    // Store the upgrade order
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    await adminSupabase.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: "upgrade",
      p_amount_cents: prorationAmount,
      p_payment_session_id: rzOrder.id,
      p_plan: toPlan,
      p_billing_period: "monthly",
      p_credits_amount: null,
    });

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_order_id: rzOrder.id,
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
        orderId,
        rzOrderId: rzOrder.id,
        prorationAmount,
        fromPlan,
        toPlan,
        keyId: Deno.env.get("RAZORPAY_KEY_ID"),
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
