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

// Subscription prices in INR
const SUBSCRIPTION_PRICES_INR: Record<string, Record<string, number>> = {
  launch: { monthly: 12367 },
  pro: { monthly: 16517, annual: 165170 },
  business: { monthly: 41417, annual: 414170 },
};

// Cashfree plan IDs
const CF_PLAN_IDS: Record<string, Record<string, string>> = {
  launch: { monthly: "solarizer_launch_monthly" },
  pro: { monthly: "solarizer_pro_monthly", annual: "solarizer_pro_annual" },
  business: { monthly: "solarizer_business_monthly", annual: "solarizer_business_annual" },
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
    const billingPeriod = subscription.billing_period || "monthly";

    // Validate upgrade path
    const planOrder: Record<string, number> = { starter: 0, launch: 1, pro: 2, business: 3 };
    if ((planOrder[toPlan] ?? 0) <= (planOrder[currentPlan] ?? 0)) {
      return new Response(
        JSON.stringify({ error: "Can only upgrade to a higher tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate proration: New Plan Price - Old Plan Price
    const oldPriceCents = SUBSCRIPTION_PRICES[currentPlan]?.[billingPeriod] || 0;
    const newPriceCents = SUBSCRIPTION_PRICES[toPlan]?.[billingPeriod];

    if (!newPriceCents) {
      return new Response(
        JSON.stringify({ error: "Invalid plan/period combination" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prorationCents = newPriceCents - oldPriceCents;
    const prorationINR = Math.round((prorationCents / 100) * 83);

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

    // If user has a saved payment method (existing subscription), we can charge directly
    // Otherwise, create a new subscription with immediate proration charge
    if (subscription.cf_subscription_id && subscription.payment_method_saved) {
      // Cancel old subscription
      await fetch(`${cashfreeBaseUrl}/subscriptions/${subscription.cf_subscription_id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": cashfreeAppId,
          "x-client-secret": cashfreeSecretKey,
        },
      });

      // Create one-time order for proration
      const orderId = `upgrade_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      
      const orderResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": cashfreeAppId,
          "x-client-secret": cashfreeSecretKey,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: prorationINR,
          order_currency: "INR",
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

      // Store upgrade order
      await supabaseClient.rpc("create_payment_order", {
        p_user_id: user.id,
        p_order_id: orderId,
        p_order_type: "upgrade",
        p_amount_cents: prorationCents,
        p_payment_session_id: orderData.payment_session_id,
        p_plan: toPlan,
        p_billing_period: billingPeriod,
        p_credits_amount: null,
      });

      return new Response(
        JSON.stringify({
          success: true,
          flowType: "proration_order",
          orderId,
          paymentSessionId: orderData.payment_session_id,
          prorationAmount: prorationINR,
          prorationCents,
          fromPlan: currentPlan,
          toPlan,
          billingPeriod,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No saved payment - create new subscription for the higher tier
    const newSubscriptionId = `sub_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const cfPlanId = CF_PLAN_IDS[toPlan]?.[billingPeriod];

    if (!cfPlanId) {
      return new Response(
        JSON.stringify({ error: "Invalid plan configuration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAmountINR = SUBSCRIPTION_PRICES_INR[toPlan]?.[billingPeriod];

    const subscriptionPayload = {
      subscription_id: newSubscriptionId,
      customer_details: {
        customer_id: user.id,
        customer_email: profile?.email || user.email,
        customer_name: profile?.display_name || "Customer",
        customer_phone: "9999999999",
      },
      plan_details: {
        plan_id: cfPlanId,
        plan_name: `Solarizer ${toPlan.charAt(0).toUpperCase() + toPlan.slice(1)} ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'}`,
        plan_type: "PERIODIC",
        plan_currency: "INR",
        plan_recurring_amount: newAmountINR,
        plan_max_cycles: billingPeriod === "annual" ? 10 : 120,
        plan_intervals: billingPeriod === "annual" ? 12 : 1,
        plan_interval_type: "MONTH",
      },
      authorization_details: {
        authorization_amount: prorationINR, // Charge proration immediately
        authorization_amount_refund: false, // This is the actual proration payment
        payment_methods: ["card", "upi"],
      },
      subscription_meta: {
        return_url: `${origin}/subscription-success?sub_id=${newSubscriptionId}&plan=${toPlan}&period=${billingPeriod}&upgrade=true`,
        notification_channel: ["EMAIL"],
      },
      subscription_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      subscription_first_charge_time: subscription.current_period_end, // Next charge at period end
      subscription_note: `Upgrade from ${currentPlan} to ${toPlan}`,
    };

    const subscriptionResponse = await fetch(`${cashfreeBaseUrl}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": cashfreeAppId,
        "x-client-secret": cashfreeSecretKey,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error("Upgrade subscription error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create upgrade subscription", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscriptionData = await subscriptionResponse.json();

    // Store pending upgrade
    await supabaseClient.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: newSubscriptionId,
      p_order_type: "upgrade",
      p_amount_cents: prorationCents,
      p_payment_session_id: subscriptionData.cf_subscription_id || newSubscriptionId,
      p_plan: toPlan,
      p_billing_period: billingPeriod,
      p_credits_amount: null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        flowType: "new_subscription",
        subscriptionId: newSubscriptionId,
        cfSubscriptionId: subscriptionData.cf_subscription_id,
        authLink: subscriptionData.subscription_payment_link || subscriptionData.data?.subscription_payment_link,
        prorationAmount: prorationINR,
        prorationCents,
        fromPlan: currentPlan,
        toPlan,
        billingPeriod,
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
