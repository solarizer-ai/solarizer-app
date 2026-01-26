import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription prices in INR (converted from USD at 83 INR per USD)
const SUBSCRIPTION_PRICES_INR: Record<string, number> = {
  launch: 12367,     // $149 * 83
  pro: 16517,        // $199 * 83
  business: 41417,   // $499 * 83
};

// Cashfree plan IDs (must match plans created on Cashfree dashboard)
const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly",
  pro: "solarizer_pro_monthly",
  business: "solarizer_business_monthly",
};

interface CreateSubscriptionRequest {
  plan: "launch" | "pro" | "business";
  billingPeriod: "monthly";
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

    const body: CreateSubscriptionRequest = await req.json();
    const { plan } = body;

    // Validate request
    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Missing plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountINR = SUBSCRIPTION_PRICES_INR[plan];
    const cfPlanId = CF_PLAN_IDS[plan];
    
    if (!amountINR || !cfPlanId) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", user.id)
      .single();

    // Generate unique subscription ID
    const subscriptionId = `sub_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;

    // Cashfree API base URL
    const cashfreeBaseUrl = cashfreeEnv === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

    // Get origin for return URL
    const origin = req.headers.get("origin") || "https://enxpro.lovable.app";

    // Create Cashfree subscription
    const subscriptionPayload = {
      subscription_id: subscriptionId,
      customer_details: {
        customer_id: user.id,
        customer_email: profile?.email || user.email,
        customer_name: profile?.display_name || "Customer",
        customer_phone: "9999999999", // Required by Cashfree
      },
      plan_details: {
        plan_id: cfPlanId,
        plan_name: `Solarizer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Monthly`,
        plan_type: "PERIODIC",
        plan_currency: "INR",
        plan_recurring_amount: amountINR,
        plan_max_cycles: 120, // 10 years max
        plan_intervals: 1,
        plan_interval_type: "MONTH",
      },
      authorization_details: {
        authorization_amount: 100, // ₹1 for card verification (refunded)
        authorization_amount_refund: true,
        payment_methods: ["card", "upi"],
      },
      subscription_meta: {
        return_url: `${origin}/subscription-success?sub_id=${subscriptionId}&plan=${plan}&period=monthly`,
        notification_channel: ["EMAIL"],
      },
      subscription_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min to complete
      subscription_first_charge_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // First charge in 2 min
      subscription_note: `Solarizer ${plan} monthly subscription`,
    };

    console.log("Creating subscription:", JSON.stringify(subscriptionPayload, null, 2));

    const cashfreeResponse = await fetch(`${cashfreeBaseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const responseText = await cashfreeResponse.text();
    console.log("Cashfree response status:", cashfreeResponse.status);
    console.log("Cashfree response:", responseText);

    if (!cashfreeResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error("Cashfree subscription error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscriptionData = JSON.parse(responseText);

    // Store pending subscription info in payment_orders for tracking
    await supabaseClient.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: subscriptionId,
      p_order_type: "subscription",
      p_amount_cents: Math.round(amountINR / 83 * 100), // Convert back to USD cents for records
      p_payment_session_id: subscriptionData.cf_subscription_id || subscriptionId,
      p_plan: plan,
      p_billing_period: "monthly",
      p_credits_amount: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId,
        cfSubscriptionId: subscriptionData.cf_subscription_id,
        authLink: subscriptionData.subscription_payment_link || subscriptionData.data?.subscription_payment_link,
        authAmount: 100,
        plan,
        billingPeriod: "monthly",
        amountINR,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
