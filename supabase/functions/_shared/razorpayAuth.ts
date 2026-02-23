/**
 * Shared Razorpay authentication utility.
 * Returns the Basic auth header for Razorpay API calls.
 */
export function getRazorpayAuth(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  return "Basic " + btoa(`${keyId}:${keySecret}`);
}
