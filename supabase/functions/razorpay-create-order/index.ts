// Full replacement for supabase/functions/razorpay-create-order/index.ts
// Changes from original:
//   - Added optional `coupon_code` to CreateOrderRequest
//   - After calculating amountCents, calls validate_coupon RPC
//   - Creates Razorpay Payment Link with discounted amount
//   - Stores coupon_id + original_amount_cents in payment_orders.metadata
//   - Returns discountApplied + originalAmountCents in response

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  orderType: "subscription" | "power_up";
  plan?: "starter" | "pro" | "business";
  billingPeriod?: "monthly";
  creditsAmount?: number;
  coupon_code?: string;
}

const PLAN_PRICES: Record<string, number> = {
  starter: 14900,
  pro: 19900,
  business: 49900,
};

const POWER_UP_RATES: Record<string, number> = {
  starter: 280,
  launch: 280,
  pro: 250,
  business: 220,
};

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://solarizer.io";

function getRazorpayAuth(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");
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
    const { orderType, plan, creditsAmount } = body;

    // Calculate base amount
    let amountCents: number;
    let description: string;

    if (orderType === "subscription" && plan) {
      amountCents = PLAN_PRICES[plan];
      description = `Solarizer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Monthly Subscription`;
    } else if (orderType === "power_up" && creditsAmount) {
      if (creditsAmount > 1800) {
        return new Response(
          JSON.stringify({ error: "Maximum 1,800 credits per transaction" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      const userPlan = subscription?.plan || "starter";
      const ratePerCredit = POWER_UP_RATES[userPlan] || POWER_UP_RATES.starter;
      amountCents = creditsAmount * ratePerCredit;
      description = `${creditsAmount} Credits Power-up`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid order parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Apply coupon discount if provided
    let couponId: string | undefined;
    let finalAmountCents = amountCents;

    if (body.coupon_code) {
      const { data: couponResult, error: couponError } = await supabase.rpc("validate_coupon", {
        p_code: body.coupon_code.toUpperCase().trim(),
        p_order_type: orderType,
        p_amount_cents: amountCents,
      });

      if (!couponError && couponResult?.valid) {
        couponId = couponResult.coupon_id;
        finalAmountCents = couponResult.final_amount_cents;
        console.log("Coupon applied:", body.coupon_code, "discount:", amountCents - finalAmountCents);
      } else {
        // Invalid coupon — proceed without discount (don't block checkout)
        console.warn("Invalid coupon provided, ignoring:", body.coupon_code);
      }
    }

    const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;
    const callbackUrl = `${FRONTEND_URL}/payment-success`;

    const rzResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: getRazorpayAuth(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: finalAmountCents, // discounted amount
        currency: "USD",
        accept_partial: false,
        description: description,
        reference_id: orderId,
        callback_url: callbackUrl,
        callback_method: "get",
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
        expire_by: Math.floor(Date.now() / 1000) + 3600,
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

    const { error: orderError } = await supabase.rpc("create_payment_order", {
      p_user_id: user.id,
      p_order_id: orderId,
      p_order_type: orderType,
      p_amount_cents: finalAmountCents,
      p_payment_session_id: paymentLink.id,
      p_plan: plan || null,
      p_billing_period: "monthly",
      p_credits_amount: creditsAmount || null,
    });

    if (orderError) {
      console.error("Failed to store order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to store payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Store coupon info in metadata if coupon was applied
    const metadata: Record<string, any> = {};
    if (couponId) {
      metadata.coupon_id = couponId;
      metadata.original_amount_cents = amountCents;
    }

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_link_id: paymentLink.id,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      })
      .eq("order_id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentLinkId: paymentLink.id,
        paymentUrl: paymentLink.short_url,
        amountCents: finalAmountCents,
        originalAmountCents: amountCents,
        discountApplied: amountCents - finalAmountCents,
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
