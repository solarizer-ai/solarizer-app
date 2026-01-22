import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
        JSON.stringify({ error: "No active subscription found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as cancel_at_period_end in our database
    const { data: cancelResult, error: cancelError } = await supabaseClient.rpc("cancel_subscription");

    if (cancelError) {
      console.error("Failed to mark subscription for cancellation:", cancelError);
      return new Response(
        JSON.stringify({ error: "Failed to cancel subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we have a Cashfree subscription, cancel it there too
    if (subscription.cf_subscription_id) {
      const cashfreeBaseUrl = cashfreeEnv === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

      try {
        // Cancel the subscription on Cashfree (stops future charges)
        const cancelResponse = await fetch(
          `${cashfreeBaseUrl}/subscriptions/${subscription.cf_subscription_id}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-version": "2023-08-01",
              "x-client-id": cashfreeAppId,
              "x-client-secret": cashfreeSecretKey,
            },
          }
        );

        if (!cancelResponse.ok) {
          const errorData = await cancelResponse.json();
          console.error("Cashfree cancel error:", errorData);
          // Don't fail the request - we've already marked it locally
        } else {
          console.log("Cashfree subscription cancelled:", subscription.cf_subscription_id);
        }
      } catch (cfError) {
        console.error("Error calling Cashfree cancel API:", cfError);
        // Don't fail - local cancellation is what matters
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription will be cancelled at the end of the billing period",
        accessUntil: subscription.current_period_end,
        cancelResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error cancelling subscription:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
