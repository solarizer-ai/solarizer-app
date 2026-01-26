import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription prices in USD cents
const SUBSCRIPTION_PRICES: Record<string, number> = {
  launch: 14900,
  pro: 19900,
  business: 49900,
};

// Cashfree plan IDs for USD billing
const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly_usd",
  pro: "solarizer_pro_monthly_usd",
  business: "solarizer_business_monthly_usd",
};

interface UpgradeRequest {
  toPlan: "pro" | "business";
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cashfreeAppId = Deno.env.get("CASHFREE_APP_ID")!;
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY")!;
    const cashfreeEnv = Deno.env.get("CASHFREE_ENVIRONMENT") || "sandbox";

    // Log environment for debugging
    console.log("=== CASHFREE CONFIG ===");
    console.log("Environment:", cashfreeEnv);
    console.log("App ID (prefix):", cashfreeAppId.substring(0, 8) + "...");
    console.log("API Version: 2025-01-01");

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: UpgradeRequest = await req.json();
    const { toPlan } = body;

    if (!toPlan || !["pro", "business"].includes(toPlan)) {
      return new Response(
        JSON.stringify({ error: "Invalid target plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentPlan = subscription.plan as string;

    // Validate upgrade path
    const planOrder: Record<string, number> = { starter: 0, launch: 1, pro: 2, business: 3 };
    if ((planOrder[toPlan] ?? 0) <= (planOrder[currentPlan] ?? 0)) {
      return new Response(
        JSON.stringify({ error: "Can only upgrade to a higher tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate proration: New Plan Price - Old Plan Price (in USD cents)
    const oldPriceCents = SUBSCRIPTION_PRICES[currentPlan] || 0;
    const newPriceCents = SUBSCRIPTION_PRICES[toPlan];

    if (!newPriceCents) {
      return new Response(
        JSON.stringify({ error: "Invalid plan configuration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prorationCents = newPriceCents - oldPriceCents;
    const prorationUSD = prorationCents / 100; // Convert to dollars for Cashfree

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", user.id)
      .single();

    const cashfreeBaseUrl = cashfreeEnv === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    const origin = req.headers.get("origin") || "https://enxpro.lovable.app";

    // Always use one-time order for proration (simpler, avoids date conflicts)
    const orderId = `upgrade_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    
    const orderResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2025-01-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: prorationUSD,
        order_currency: "USD",
        customer_details: {
          customer_id: user.id,
          customer_email: profile?.email || user.email,
          customer_name: profile?.display_name || "Customer",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: `${origin}/payment-success?order_id=${orderId}&upgrade=true&to_plan=${toPlan}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
        order_note: `Upgrade from ${currentPlan} to ${toPlan}`,
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error("Proration order error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create proration order", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData = await orderResponse.json();

    // Debug logging
    console.log("=== CASHFREE ORDER RESPONSE ===");
    console.log("Full response:", JSON.stringify(orderData, null, 2));
    console.log("payment_session_id:", orderData.payment_session_id);
    console.log("Type:", typeof orderData.payment_session_id);

    // Robust extraction (handle potential nested structures)
    let paymentSessionId = orderData.payment_session_id;
    if (!paymentSessionId && orderData.data?.payment_session_id) {
      paymentSessionId = orderData.data.payment_session_id;
    }

    // Validate before proceeding
    if (!paymentSessionId) {
      console.error("CRITICAL: payment_session_id missing from response");
      return new Response(
        JSON.stringify({ 
          error: "Payment session not received from gateway",
          details: orderData 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store upgrade order (in USD cents)
    await supabaseClient.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: "upgrade",
      p_amount_cents: prorationCents,
      p_payment_session_id: paymentSessionId,
      p_plan: toPlan,
      p_billing_period: "monthly",
      p_credits_amount: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        flowType: "proration_order",
        orderId,
        paymentSessionId: paymentSessionId,
        prorationAmount: prorationUSD,
        prorationCents,
        fromPlan: currentPlan,
        toPlan,
        billingPeriod: "monthly",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error upgrading subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
