import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyOrderSignature } from "../_shared/razorpaySignature.ts";

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://solarizer-app.lovable.app";

function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error: orderError } = await adminSupabase
      .from("payment_orders")
      .select("order_id, status, user_id")
      .eq("rz_order_id", razorpay_order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found for rz_order_id:", razorpay_order_id, orderError);
      return Response.redirect(`${FRONTEND_URL}/pricing?error=order_not_found`, 302);
    }

    if (order.status === "paid") {
      console.log("Order already processed, redirecting to success");
      return Response.redirect(`${FRONTEND_URL}/payment-success?order_id=${order.order_id}`, 302);
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return Response.redirect(`${FRONTEND_URL}/pricing?error=config_error`, 302);
    }

    // Timing-safe signature verification via shared module
    const isValid = await verifyOrderSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error("Invalid signature for order:", order.order_id);
      return Response.redirect(`${FRONTEND_URL}/pricing?error=invalid_signature`, 302);
    }

    await adminSupabase
      .from("payment_orders")
      .update({
        rz_payment_id: razorpay_payment_id,
        rz_signature: razorpay_signature,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.order_id);

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
    return Response.redirect(`${FRONTEND_URL}/payment-success?order_id=${order.order_id}`, 302);

  } catch (error) {
    console.error("Callback error:", error);
    return Response.redirect(`${FRONTEND_URL}/pricing?error=callback_failed`, 302);
  }
});
