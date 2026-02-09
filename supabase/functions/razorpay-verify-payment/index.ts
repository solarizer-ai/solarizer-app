import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentLinkRequest {
  razorpay_payment_id: string;
  razorpay_payment_link_id: string;
  razorpay_payment_link_reference_id: string; // Our internal order_id
  razorpay_payment_link_status: string;
  razorpay_signature: string;
}

// Payment Links signature formula:
// hmac_sha256(payment_link_id + "|" + reference_id + "|" + status + "|" + payment_id, secret)
async function verifyPaymentLinkSignature(
  paymentLinkId: string,
  referenceId: string,
  status: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return expectedSignature === signature;
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

    const body: VerifyPaymentLinkRequest = await req.json();
    const { 
      razorpay_payment_id, 
      razorpay_payment_link_id, 
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_signature 
    } = body;

    // The reference_id is our internal order_id
    const orderId = razorpay_payment_link_reference_id;

    if (!orderId || !razorpay_payment_link_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to check order status and process
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if already processed (idempotency)
    const { data: existingOrder } = await adminSupabase
      .from("payment_orders")
      .select("status, rz_payment_id, order_type, plan, billing_period, credits_amount, amount_cents")
      .eq("order_id", orderId)
      .single();

    if (existingOrder?.status === 'paid') {
      // Already processed - return success with existing data
      const { data: credits } = await adminSupabase
        .from("nloc_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          already_processed: true,
          status: "paid",
          orderType: existingOrder.order_type,
          plan: existingOrder.plan,
          billingPeriod: existingOrder.billing_period,
          creditsAmount: existingOrder.credits_amount,
          amountCents: existingOrder.amount_cents,
          creditsRemaining: credits?.credits_remaining || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the signature
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyPaymentLinkSignature(
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error("Invalid payment signature for order:", orderId);
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order with Razorpay payment details
    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_id: razorpay_payment_id,
        rz_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    // Process the payment success
    const { data: result, error: processError } = await adminSupabase.rpc(
      "process_payment_success",
      {
        p_order_id: orderId,
        p_cf_payment_id: razorpay_payment_id, // Using existing column name for compatibility
      }
    );

    if (processError) {
      console.error("Error processing payment:", processError);
      return new Response(
        JSON.stringify({ error: "Failed to process payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get updated credits
    const { data: credits } = await adminSupabase
      .from("nloc_credits")
      .select("credits_remaining")
      .eq("user_id", user.id)
      .single();

    // Get order details for response
    const { data: orderDetails } = await adminSupabase
      .from("payment_orders")
      .select("order_type, plan, billing_period, credits_amount, amount_cents")
      .eq("order_id", orderId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        status: "paid",
        orderType: orderDetails?.order_type,
        plan: orderDetails?.plan,
        billingPeriod: orderDetails?.billing_period,
        creditsAmount: orderDetails?.credits_amount,
        amountCents: orderDetails?.amount_cents,
        creditsRemaining: credits?.credits_remaining || 0,
        ...result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
