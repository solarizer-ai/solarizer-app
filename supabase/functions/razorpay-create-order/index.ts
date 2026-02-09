import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  orderType: "subscription" | "power_up" | "upgrade";
  plan?: "launch" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  billingData?: {
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    company_name?: string;
    tax_id?: string;
  };
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
    const { orderType, plan, creditsAmount, billingData, prorationAmount } = body;

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

    // Generate internal order ID
    const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;

    // Create Razorpay order
    const rzResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents, // Razorpay uses smallest currency unit
        currency: "USD",
        receipt: orderId,
        notes: {
          user_id: user.id,
          order_type: orderType,
          plan: plan || null,
          credits_amount: creditsAmount || null,
        },
      }),
    });

    if (!rzResponse.ok) {
      const errorText = await rzResponse.text();
      console.error("Razorpay create order error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzOrder = await rzResponse.json();

    // Store billing profile if provided
    if (billingData) {
      await supabase.from("billing_profiles").upsert({
        user_id: user.id,
        phone: billingData.phone,
        address_line1: billingData.address_line1,
        address_line2: billingData.address_line2 || null,
        city: billingData.city,
        state: billingData.state,
        postal_code: billingData.postal_code,
        country: billingData.country,
        company_name: billingData.company_name || null,
        tax_id: billingData.tax_id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    // Store order in database using RPC
    const { error: orderError } = await supabase.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: orderType,
      p_amount_cents: amountCents,
      p_payment_session_id: rzOrder.id, // Store Razorpay order ID here temporarily
      p_plan: plan || null,
      p_billing_period: "monthly",
      p_credits_amount: creditsAmount || null,
    });

    if (orderError) {
      console.error("Failed to store order:", orderError);
    }

    // Update the order with the Razorpay order ID
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    await adminSupabase
      .from("payment_orders")
      .update({ rz_order_id: rzOrder.id })
      .eq("order_id", orderId);

    const supabaseProjectUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseProjectUrl}/functions/v1/razorpay-callback`;

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        rzOrderId: rzOrder.id,
        amountCents,
        currency: "USD",
        description,
        keyId: Deno.env.get("RAZORPAY_KEY_ID"),
        callbackUrl,
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
