import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

// Verify Cashfree webhook signature
async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string
): Promise<boolean> {
  try {
    const message = timestamp + rawBody;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const computedSignature = base64Encode(new Uint8Array(signatureBuffer));
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const cashfreeSecretKey = Deno.env.get("CASHFREE_SECRET_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    // Verify signature
    const isValid = await verifyWebhookSignature(rawBody, signature, timestamp, cashfreeSecretKey);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const data = payload.data;

    console.log("Webhook received:", eventType, data?.order?.order_id);

    if (eventType === "PAYMENT_SUCCESS" || eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = data.order?.order_id;
      const cfPaymentId = data.payment?.cf_payment_id?.toString();

      if (!orderId || !cfPaymentId) {
        console.error("Missing order_id or cf_payment_id");
        return new Response(
          JSON.stringify({ error: "Missing order data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Process payment with idempotency (the RPC handles duplicate calls)
      const { data: result, error } = await supabaseClient.rpc("process_payment_success", {
        p_order_id: orderId,
        p_cf_payment_id: cfPaymentId,
      });

      if (error) {
        console.error("Error processing payment:", error);
        return new Response(
          JSON.stringify({ error: "Failed to process payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment processed:", result);
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eventType === "PAYMENT_FAILED" || eventType === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = data.order?.order_id;

      if (orderId) {
        await supabaseClient.rpc("mark_payment_failed", { p_order_id: orderId });
        console.log("Payment marked as failed:", orderId);
      }

      return new Response(
        JSON.stringify({ success: true, status: "failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other events, just acknowledge
    console.log("Unhandled event type:", eventType);
    return new Response(
      JSON.stringify({ success: true, message: "Event acknowledged" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Cashfree from retrying for parsing errors
    return new Response(
      JSON.stringify({ error: "Webhook processing error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
