import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  orderType: "subscription" | "power_up" | "upgrade";
  plan?: "starter" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  // For upgrades
  fromPlan?: string;
  toPlan?: string;
  prorationAmount?: number;
}

// Plan prices in cents (USD)
const PLAN_PRICES: Record<string, number> = {
  launch: 14900, // $149
  pro: 19900, // $199
  business: 49900, // $499
};

// Power-up prices per credit in cents based on plan
const POWER_UP_RATES: Record<string, number> = {
  starter: 700, // $7.00
  launch: 700, // $7.00
  pro: 600, // $6.00
  business: 500, // $5.00
};

// Frontend URL for callbacks
const FRONTEND_URL = "https://solarizer-app.lovable.app";

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

    const body: CreateOrderRequest = await req.json();
    const { orderType, plan, creditsAmount, prorationAmount } = body;

    // Calculate amount based on order type
    let amountCents: number;
    let description: string;

    if (orderType === "subscription" && plan) {
      amountCents = PLAN_PRICES[plan];
      description = `Solarizer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Monthly Subscription`;
    } else if (orderType === "power_up" && creditsAmount) {
      // Get user's current plan for pricing
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      
      const userPlan = subscription?.plan || "starter";
      const ratePerCredit = POWER_UP_RATES[userPlan] || POWER_UP_RATES.starter;
      amountCents = creditsAmount * ratePerCredit;
      description = `${creditsAmount} Credits Power-up`;
    } else if (orderType === "upgrade" && prorationAmount) {
      amountCents = prorationAmount;
      description = `Upgrade to ${body.toPlan?.charAt(0).toUpperCase()}${body.toPlan?.slice(1)} Plan`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid order parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate internal order ID (used as reference_id in Payment Link)
    const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;

    // Callback URL - Razorpay will redirect here after payment
    const callbackUrl = `${FRONTEND_URL}/payment-success`;

    // Create Razorpay Payment Link (full-page redirect checkout)
    const rzResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents, // Razorpay uses smallest currency unit
        currency: "USD",
        accept_partial: false,
        description: description,
        reference_id: orderId, // Our internal order ID for lookup
        callback_url: callbackUrl,
        callback_method: "get", // GET is easier to handle on frontend
        customer: {
          name: user.user_metadata?.display_name || user.email?.split("@")[0] || "",
          email: user.email,
        },
        notes: {
          user_id: user.id,
          order_type: orderType,
          plan: plan || "",
          credits_amount: String(creditsAmount || 0),
        },
        expire_by: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
      }),
    });

    if (!rzResponse.ok) {
      const errorText = await rzResponse.text();
      console.error("Razorpay create payment link error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentLink = await rzResponse.json();
    console.log("Payment link created:", paymentLink.id);

    // Store order in database using RPC
    const { error: orderError } = await supabase.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: orderType,
      p_amount_cents: amountCents,
      p_payment_session_id: paymentLink.id, // Store Payment Link ID here
      p_plan: plan || null,
      p_billing_period: "monthly",
      p_credits_amount: creditsAmount || null,
    });

    if (orderError) {
      console.error("Failed to store order:", orderError);
    }

    // Update the order with the Razorpay Payment Link ID
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    await adminSupabase
      .from("payment_orders")
      .update({ rz_payment_link_id: paymentLink.id })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentLinkId: paymentLink.id,
        paymentUrl: paymentLink.short_url, // Full-page checkout URL
        amountCents,
        currency: "USD",
        description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
