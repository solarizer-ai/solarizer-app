import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription prices in USD (dollars, not cents)
const SUBSCRIPTION_PRICES_USD: Record<string, number> = {
  launch: 149,
  pro: 199,
  business: 499,
};

// Cashfree plan IDs for USD billing
const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly_usd",
  pro: "solarizer_pro_monthly_usd",
  business: "solarizer_business_monthly_usd",
};

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

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "No subscription found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If subscription is just marked for cancellation (not yet cancelled), just clear the flag
    if (subscription.cancel_at_period_end && subscription.status === "active") {
      const { data: result, error: updateError } = await supabaseClient.rpc("reactivate_subscription");

      if (updateError) {
        console.error("Failed to reactivate subscription:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to reactivate subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription reactivated",
          flowType: "flag_cleared",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If subscription is actually cancelled/expired, need to create a new one
    if (subscription.status === "canceled" || subscription.status === "past_due") {
      const plan = subscription.plan;
      
      const cfPlanId = CF_PLAN_IDS[plan];
      const amountUSD = SUBSCRIPTION_PRICES_USD[plan];

      if (!cfPlanId || !amountUSD) {
        return new Response(
          JSON.stringify({ error: "Invalid plan configuration for reactivation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
      const newSubscriptionId = `sub_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;

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
          plan_name: `Solarizer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Monthly`,
          plan_type: "PERIODIC",
          plan_currency: "USD",
          plan_recurring_amount: amountUSD,
          plan_max_cycles: 120,
          plan_intervals: 1,
          plan_interval_type: "MONTH",
        },
        authorization_details: {
          authorization_amount: 1, // $1 for card verification (refunded)
          authorization_amount_refund: true,
          payment_methods: ["card"],
        },
        subscription_meta: {
          return_url: `${origin}/subscription-success?sub_id=${newSubscriptionId}&plan=${plan}&period=monthly&reactivate=true`,
          notification_channel: ["EMAIL"],
        },
        subscription_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        subscription_first_charge_time: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        subscription_note: `Solarizer ${plan} monthly subscription (reactivation)`,
      };

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

      if (!cashfreeResponse.ok) {
        const errorData = await cashfreeResponse.json();
        console.error("Reactivation subscription error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to create reactivation subscription", details: errorData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const subscriptionData = await cashfreeResponse.json();

      // Store reactivation order (in USD cents)
      await supabaseClient.rpc("create_payment_order", {
        p_user_id: user.id,
        p_order_id: newSubscriptionId,
        p_order_type: "subscription",
        p_amount_cents: amountUSD * 100, // Store as USD cents
        p_payment_session_id: subscriptionData.cf_subscription_id || newSubscriptionId,
        p_plan: plan,
        p_billing_period: "monthly",
        p_credits_amount: null,
      });

      return new Response(
        JSON.stringify({
          success: true,
          flowType: "new_subscription",
          subscriptionId: newSubscriptionId,
          cfSubscriptionId: subscriptionData.cf_subscription_id,
          authLink: subscriptionData.subscription_payment_link || subscriptionData.data?.subscription_payment_link,
          plan,
          billingPeriod: "monthly",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Subscription is already active" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error reactivating subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
