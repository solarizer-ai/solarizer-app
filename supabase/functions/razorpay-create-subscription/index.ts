import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateSubscriptionRequest {
  plan: "starter" | "pro" | "business";
  billingPeriod: "monthly";
}

// These should be set as environment variables after creating plans in Razorpay
// Create plans via Razorpay API or Dashboard first
const RAZORPAY_PLAN_IDS: Record<string, string> = {
  starter: Deno.env.get("RAZORPAY_PLAN_LAUNCH") || "plan_launch_monthly",
  pro: Deno.env.get("RAZORPAY_PLAN_PRO") || "plan_pro_monthly",
  business: Deno.env.get("RAZORPAY_PLAN_BUSINESS") || "plan_business_monthly",
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

    const body: CreateSubscriptionRequest = await req.json();
    const { plan } = body;

    if (!plan || !RAZORPAY_PLAN_IDS[plan]) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzPlanId = RAZORPAY_PLAN_IDS[plan];

    // L1: Validate plan ID is not a placeholder
    if (rzPlanId.startsWith("plan_") && (rzPlanId.includes("_monthly") || rzPlanId.includes("_launch"))) {
      return new Response(
        JSON.stringify({ error: "Plan not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // H2: Prevent duplicate active subscriptions
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("rz_subscription_id, status")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.rz_subscription_id && existingSub.status !== "canceled") {
      return new Response(
        JSON.stringify({ error: "Active subscription already exists. Cancel it first to create a new one." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email for customer notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single();

    // Create Razorpay subscription
    const rzResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: rzPlanId,
        total_count: 120, // 10 years of monthly billing
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan: plan,
          email: profile?.email || user.email,
        },
      }),
    });

    if (!rzResponse.ok) {
      const errorText = await rzResponse.text();
      console.error("Razorpay create subscription error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rzSubscription = await rzResponse.json();

    // Store the pending subscription ID
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    await adminSupabase
      .from("subscriptions")
      .update({
        rz_subscription_id: rzSubscription.id,
        rz_plan_id: rzPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: rzSubscription.id,
        shortUrl: rzSubscription.short_url,
        status: rzSubscription.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
