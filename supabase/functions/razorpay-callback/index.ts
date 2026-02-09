import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Razorpay POSTs to this callback after payment on hosted checkout
// We verify signature, process payment, and redirect user to success page

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://solarizer-app.lovable.app";

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = `${orderId}|${paymentId}`;
  
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

function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle POST from Razorpay after payment
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse form-encoded body from Razorpay
    const bodyText = await req.text();
    const formData = parseFormData(bodyText);
    
    const razorpay_order_id = formData.razorpay_order_id;
    const razorpay_payment_id = formData.razorpay_payment_id;
    const razorpay_signature = formData.razorpay_signature;

    console.log("Razorpay callback received:", { razorpay_order_id, razorpay_payment_id });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("Missing required fields in callback");
      return Response.redirect(`${FRONTEND_URL}/pricing?error=missing_fields`, 302);
    }

    // Initialize Supabase with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Find our internal order using the Razorpay order ID
    const { data: order, error: orderError } = await adminSupabase
      .from("payment_orders")
      .select("order_id, status, user_id")
      .eq("rz_order_id", razorpay_order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found for rz_order_id:", razorpay_order_id, orderError);
      return Response.redirect(`${FRONTEND_URL}/pricing?error=order_not_found`, 302);
    }

    // Idempotency: If already paid, just redirect to success
    if (order.status === "paid") {
      console.log("Order already processed, redirecting to success");
      return Response.redirect(`${FRONTEND_URL}/payment-success?order_id=${order.order_id}`, 302);
    }

    // Verify the payment signature
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return Response.redirect(`${FRONTEND_URL}/pricing?error=config_error`, 302);
    }

    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error("Invalid signature for order:", order.order_id);
      return Response.redirect(`${FRONTEND_URL}/pricing?error=invalid_signature`, 302);
    }

    // Update order with Razorpay payment details
    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_id: razorpay_payment_id,
        rz_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.order_id);

    // Process the payment (add credits, update subscription, etc.)
    const { error: processError } = await adminSupabase.rpc(
      "process_payment_success",
      {
        p_order_id: order.order_id,
        p_cf_payment_id: razorpay_payment_id,
      }
    );

    if (processError) {
      console.error("Error processing payment:", processError);
      return Response.redirect(`${FRONTEND_URL}/pricing?error=process_failed`, 302);
    }

    console.log("Payment processed successfully, redirecting to success page");
    
    // Redirect user to success page
    return Response.redirect(`${FRONTEND_URL}/payment-success?order_id=${order.order_id}`, 302);

  } catch (error) {
    console.error("Callback error:", error);
    return Response.redirect(`${FRONTEND_URL}/pricing?error=callback_failed`, 302);
  }
});
