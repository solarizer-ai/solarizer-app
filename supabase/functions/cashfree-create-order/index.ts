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

// Power-up rates per credit in USD cents by plan
const POWER_UP_RATES: Record<string, number> = {
  starter: 700,
  launch: 700,
  pro: 600,
  business: 500,
};

interface BillingData {
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  use_different_billing_address: boolean;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  tax_id?: string;
  company_name?: string;
}

interface CreateOrderRequest {
  orderType: "subscription" | "power_up";
  plan?: "starter" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  billingData?: BillingData;
  returnUrl?: string;
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
    const { orderType, plan, creditsAmount, billingData } = body;

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
      if (!plan) {
        return new Response(
          JSON.stringify({ error: "Missing plan for subscription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const planPrice = SUBSCRIPTION_PRICES[plan];
      if (!planPrice) {
        return new Response(
          JSON.stringify({ error: "Invalid plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      amountCents = planPrice;
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
    
    // Convert cents to dollars for Cashfree
    const amountUSD = amountCents / 100;

    // Get user profile for customer details
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", user.id)
      .single();

    // Fetch billing profile if not provided in request
    let effectiveBillingData = billingData;
    if (!effectiveBillingData) {
      const { data: storedBilling } = await supabaseClient
        .from("billing_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (storedBilling) {
        effectiveBillingData = storedBilling as BillingData;
      }
    }

    // Determine customer phone (use billing data or fallback)
    const customerPhone = effectiveBillingData?.phone || "9999999999";

    // Get origin with fallbacks for return_url
    const getOriginUrl = (): string => {
      // 1. Explicit returnUrl from request body (most reliable)
      if (body.returnUrl) {
        return body.returnUrl.replace(/\/$/, ''); // Remove trailing slash
      }
      
      // 2. Origin header
      const origin = req.headers.get("origin");
      if (origin && origin !== "null") {
        return origin;
      }
      
      // 3. Referer header (extract origin)
      const referer = req.headers.get("referer");
      if (referer) {
        try {
          const url = new URL(referer);
          return url.origin;
        } catch {}
      }
      
      // 4. Fallback to production URL
      return "https://solarizer-app.lovable.app";
    };

    const originUrl = getOriginUrl();
    console.log("Using origin URL:", originUrl);

    // Build order_tags for address metadata (Cashfree supports up to 10 key-value pairs)
    const orderTags: Record<string, string> = {};
    if (effectiveBillingData) {
      // Determine which address to use for billing
      const billingAddr = effectiveBillingData.use_different_billing_address
        ? {
            line1: effectiveBillingData.billing_address_line1,
            line2: effectiveBillingData.billing_address_line2,
            city: effectiveBillingData.billing_city,
            state: effectiveBillingData.billing_state,
            postal: effectiveBillingData.billing_postal_code,
            country: effectiveBillingData.billing_country,
          }
        : {
            line1: effectiveBillingData.address_line1,
            line2: effectiveBillingData.address_line2,
            city: effectiveBillingData.city,
            state: effectiveBillingData.state,
            postal: effectiveBillingData.postal_code,
            country: effectiveBillingData.country,
          };

      orderTags.billing_city = billingAddr.city || "";
      orderTags.billing_state = billingAddr.state || "";
      orderTags.billing_country = billingAddr.country || "";
      orderTags.billing_postal = billingAddr.postal || "";
      if (effectiveBillingData.company_name) {
        orderTags.company_name = effectiveBillingData.company_name;
      }
      if (effectiveBillingData.tax_id) {
        orderTags.tax_id = effectiveBillingData.tax_id;
      }
    }

    // Create Cashfree order
    const cashfreeBaseUrl = cashfreeEnv === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    const orderPayload: Record<string, unknown> = {
      order_id: orderId,
      order_amount: amountUSD,
      order_currency: "USD",
      customer_details: {
        customer_id: user.id,
        customer_email: profile?.email || user.email,
        customer_name: profile?.display_name || "Customer",
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${originUrl}/payment-success?order_id=${orderId}`,
        notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
      },
      order_note: orderType === "subscription" 
        ? `${plan} monthly subscription`
        : `${creditsAmount} credits power-up`,
    };

    // Add order_tags if we have any
    if (Object.keys(orderTags).length > 0) {
      orderPayload.order_tags = orderTags;
    }

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2025-01-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
      },
      body: JSON.stringify(orderPayload),
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

    // Debug logging
    console.log("=== CASHFREE ORDER RESPONSE ===");
    console.log("Full response:", JSON.stringify(cashfreeOrder, null, 2));
    console.log("payment_session_id:", cashfreeOrder.payment_session_id);

    // Robust extraction
    let paymentSessionId = cashfreeOrder.payment_session_id;
    if (!paymentSessionId && cashfreeOrder.data?.payment_session_id) {
      paymentSessionId = cashfreeOrder.data.payment_session_id;
    }

    if (!paymentSessionId) {
      console.error("CRITICAL: payment_session_id missing from response");
      return new Response(
        JSON.stringify({ 
          error: "Payment session not received from gateway",
          details: cashfreeOrder 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store order in database using RPC (store in USD cents)
    const { error: insertError } = await supabaseClient.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: orderType,
      p_amount_cents: amountCents,
      p_payment_session_id: paymentSessionId,
      p_plan: plan || null,
      p_billing_period: "monthly",
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
        paymentSessionId: paymentSessionId,
        orderAmount: amountUSD,
        orderCurrency: "USD",
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
