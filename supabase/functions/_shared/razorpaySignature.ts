/**
 * Shared Razorpay signature verification with timing-safe comparison.
 * All functions use crypto.subtle.verify for constant-time comparison (fixes M1).
 */

const encoder = new TextEncoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verify Razorpay webhook signature (x-razorpay-signature header).
 * Signature is HMAC-SHA256(rawBody, webhookSecret).
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await importHmacKey(secret);
  const signatureBytes = hexToUint8Array(signature);
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(rawBody)
  );
}

/**
 * Verify Razorpay Payment Link callback signature.
 * Formula: HMAC-SHA256(payment_link_id|reference_id|status|payment_id, secret)
 */
export async function verifyPaymentLinkSignature(
  paymentLinkId: string,
  referenceId: string,
  status: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const data = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  const key = await importHmacKey(secret);
  const signatureBytes = hexToUint8Array(signature);
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(data)
  );
}

