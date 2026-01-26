

## Summary

Update all Cashfree Edge Functions to use API version `2025-01-01` and add comprehensive logging to debug the `payment_session_id_invalid` error.

---

## Root Cause

The edge functions are using API version `2023-08-01` (lines 126, 137, 141 in various files), but you've updated your Cashfree dashboard to use the 2025 API. This version mismatch causes the returned `payment_session_id` to be invalid for the Cashfree SDK.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/cashfree-upgrade-subscription/index.ts` | Update API version, add logging |
| `supabase/functions/cashfree-create-order/index.ts` | Update API version, add logging |
| `supabase/functions/cashfree-create-subscription/index.ts` | Update API version, add logging |
| `src/hooks/useCashfreeSubscription.ts` | Add debug logging for SDK checkout |

---

## Changes Required

### 1. Update API Version in All Edge Functions

Change `x-api-version` from `"2023-08-01"` to `"2025-01-01"`:

```typescript
// BEFORE
"x-api-version": "2023-08-01",

// AFTER  
"x-api-version": "2025-01-01",
```

### 2. Add Logging in cashfree-upgrade-subscription

After line 157, add comprehensive response logging:

```typescript
const orderData = await orderResponse.json();

// Debug logging
console.log("=== CASHFREE ORDER RESPONSE ===");
console.log("Full response:", JSON.stringify(orderData, null, 2));
console.log("payment_session_id:", orderData.payment_session_id);
console.log("Type:", typeof orderData.payment_session_id);

// Robust extraction (handle potential nested structures)
let paymentSessionId = orderData.payment_session_id;
if (!paymentSessionId && orderData.data?.payment_session_id) {
  paymentSessionId = orderData.data.payment_session_id;
}

// Validate before proceeding
if (!paymentSessionId) {
  console.error("CRITICAL: payment_session_id missing from response");
  return new Response(
    JSON.stringify({ 
      error: "Payment session not received from gateway",
      details: orderData 
    }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### 3. Add Debug Logging in Frontend Hook

In `useCashfreeSubscription.ts`, add logging before Cashfree SDK call:

```typescript
if (flowType === "proration_order" && response.data.paymentSessionId) {
  console.log("=== CASHFREE CHECKOUT DEBUG ===");
  console.log("Payment Session ID:", response.data.paymentSessionId);
  console.log("Full response:", response.data);
  
  const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";
  console.log("SDK Mode:", cashfreeMode);
  
  if (typeof window.Cashfree !== "undefined") {
    try {
      const cashfree = new window.Cashfree({ mode: cashfreeMode });
      await cashfree.checkout({
        paymentSessionId: response.data.paymentSessionId,
        redirectTarget: "_self",
      });
      return true;
    } catch (checkoutError) {
      console.error("Cashfree SDK checkout error:", checkoutError);
      toast({
        title: "Checkout Failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  } else {
    console.error("Cashfree SDK not loaded on window");
    toast({
      title: "Payment Error",
      description: "Payment system not loaded. Please refresh and try again.",
      variant: "destructive",
    });
    return false;
  }
}
```

### 4. Add Environment Logging

In all edge functions, add environment logging after line 44:

```typescript
const cashfreeEnv = Deno.env.get("CASHFREE_ENVIRONMENT") || "sandbox";

// Log environment for debugging
console.log("=== CASHFREE CONFIG ===");
console.log("Environment:", cashfreeEnv);
console.log("App ID (prefix):", cashfreeAppId.substring(0, 8) + "...");
console.log("API Version: 2025-01-01");
```

---

## Technical Summary

| Item | Before | After |
|------|--------|-------|
| API Version | `2023-08-01` | `2025-01-01` |
| Response Logging | None | Full JSON + session ID extraction |
| Error Handling | Basic | Robust with fallback extraction |
| Frontend Debugging | None | Console logs before SDK call |

---

## Verification Steps

After deployment:

1. **Trigger an upgrade** from the Settings page
2. **Check Edge Function logs** in backend for:
   - `=== CASHFREE CONFIG ===` showing environment
   - `=== CASHFREE ORDER RESPONSE ===` showing full API response
   - `payment_session_id:` showing the extracted value
3. **Check Browser Console** for:
   - `=== CASHFREE CHECKOUT DEBUG ===`
   - Session ID being passed to SDK
   - Any SDK errors

---

## Expected Outcome

With API version `2025-01-01`, the Cashfree API will return a valid `payment_session_id` that matches the SDK version, resolving the "payment_session_id is not present or is invalid" error.

