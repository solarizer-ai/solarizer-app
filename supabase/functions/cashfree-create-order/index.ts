import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription prices in USD cents
const SUBSCRIPTION_PRICES: Record<string, Record<string, number>> = {
  launch: { monthly: 14900 },
  pro: { monthly: 19900, annual: 199000 },
  business: { monthly: 49900, annual: 499000 },
};

// Power-up rates per credit in USD cents by plan
const POWER_UP_RATES: Record<string, number> = {
  starter: 700,
  launch: 700,
  pro: 600,
  business: 500,
};

interface CreateOrderRequest {
  orderType: "subscription" | "power_up";
  plan?: "launch" | "pro" | "business";
  billingPeriod?: "monthly" | "annual";
  creditsAmount?: number;
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

    // Get user from auth token
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateOrderRequest = await req.json();
    const { orderType, plan, billingPeriod, creditsAmount } = body;

    // Validate request
    if (!orderType) {
      return new Response(
        JSON.stringify({ error: "Missing orderType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let amountCents: number;
    let orderCreditsAmount: number | null = null;

    if (orderType === "subscription") {
      if (!plan || !billingPeriod) {
        return new Response(
          JSON.stringify({ error: "Missing plan or billingPeriod for subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const planPrices = SUBSCRIPTION_PRICES[plan];
      if (!planPrices || !planPrices[billingPeriod]) {
        return new Response(
          JSON.stringify({ error: "Invalid plan or billing period" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      amountCents = planPrices[billingPeriod];
    } else if (orderType === "power_up") {
      if (!creditsAmount || creditsAmount < 100) {
        return new Response(
          JSON.stringify({ error: "Credits amount must be at least 100" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's current plan for pricing
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      const userPlan = subscription?.plan || "starter";
      const ratePerCredit = POWER_UP_RATES[userPlan] || POWER_UP_RATES.starter;
      amountCents = creditsAmount * ratePerCredit;
      orderCreditsAmount = creditsAmount;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid orderType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order ID
    const orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    
    // Convert cents to INR (approximate conversion rate: 1 USD = 83 INR)
    const USD_TO_INR_RATE = 83;
    const amountDollars = amountCents / 100;
    const amountINR = Math.round(amountDollars * USD_TO_INR_RATE);

    // Get user profile for customer details
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", user.id)
      .single();

    // Create Cashfree order
    const cashfreeBaseUrl = cashfreeEnv === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amountINR,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_email: profile?.email || user.email,
          customer_name: profile?.display_name || "Customer",
          customer_phone: "9999999999", // Required by Cashfree but we don't collect it
        },
        order_meta: {
          return_url: `${req.headers.get("origin")}/payment-success?order_id=${orderId}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
        order_note: orderType === "subscription" 
          ? `${plan} ${billingPeriod} subscription`
          : `${creditsAmount} credits power-up`,
      }),
    });

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.json();
      console.error("Cashfree error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cashfreeOrder = await cashfreeResponse.json();

    // Store order in database using RPC
    const { error: insertError } = await supabaseClient.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: orderType,
      p_amount_cents: amountCents,
      p_payment_session_id: cashfreeOrder.payment_session_id,
      p_plan: plan || null,
      p_billing_period: billingPeriod || null,
      p_credits_amount: orderCreditsAmount,
    });

    if (insertError) {
      console.error("Failed to store order:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentSessionId: cashfreeOrder.payment_session_id,
        orderAmount: amountINR,
        orderCurrency: "INR",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
