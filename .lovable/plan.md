
# Plan: Fix Razorpay Payment Flow Issues

## Problem Summary
After successful Razorpay payment, users are not redirected to the success page. The payment actually succeeds (credits are added), but the verification step fails on retry attempts.

## Root Causes Identified

1. **Field Name Mismatch**: The edge function expects `addressLine1` (camelCase) but receives `address_line1` (snake_case)
2. **Missing Idempotency**: The verify endpoint returns 400 on duplicate calls instead of graceful success
3. **No Early Success Check**: Frontend doesn't check if order is already paid before retrying verification

---

## Implementation Steps

### Step 1: Fix Billing Data Field Mapping in Edge Function
**File**: `supabase/functions/razorpay-create-order/index.ts`

Update the interface and mapping to accept snake_case fields that match the frontend:

```typescript
billingData?: {
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  company_name?: string;
  tax_id?: string;
}
```

And update the upsert mapping:
```typescript
address_line1: billingData.address_line1,
address_line2: billingData.address_line2 || null,
postal_code: billingData.postal_code,
company_name: billingData.company_name || null,
tax_id: billingData.tax_id || null,
```

### Step 2: Add Idempotency to Payment Verification
**File**: `supabase/functions/razorpay-verify-payment/index.ts`

Before verifying signature, check if order is already paid:

```typescript
// Check if already processed (idempotency)
const { data: existingOrder } = await adminSupabase
  .from("payment_orders")
  .select("status, rz_payment_id")
  .eq("order_id", order_id)
  .single();

if (existingOrder?.status === 'paid') {
  return new Response(
    JSON.stringify({
      success: true,
      already_processed: true,
      message: "Payment already verified",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Step 3: Improve Frontend Handler Robustness
**File**: `src/hooks/useRazorpayCheckout.ts`

Handle `already_processed` response as success:

```typescript
if (verifyError || !verifyResult?.success) {
  toast({
    title: "Payment Verification Failed",
    description: verifyResult?.error || "Please contact support.",
    variant: "destructive",
  });
  setIsLoading(false);
  resolve(false);
  return;
}

// Redirect to success page (works for both new and already_processed)
window.location.href = `/payment-success?order_id=${orderId}`;
resolve(true);
```

### Step 4: Add Order State Verification Before Redirect
**File**: `src/hooks/useRazorpayCheckout.ts`

After verification, confirm the order is readable before redirecting (from the troubleshooting pattern):

```typescript
// Verify order is accessible before redirecting
const { data: confirmedOrder } = await supabase
  .from("payment_orders")
  .select("status")
  .eq("order_id", orderId)
  .single();

if (confirmedOrder?.status === 'paid') {
  window.location.href = `/payment-success?order_id=${orderId}`;
  resolve(true);
} else {
  // Fallback: redirect anyway since webhook may process it
  window.location.href = `/payment-success?order_id=${orderId}`;
  resolve(true);
}
```

---

## Technical Details

| Change | File | Purpose |
|--------|------|---------|
| Fix field mapping | `razorpay-create-order/index.ts` | Prevent billing profile insert errors |
| Add idempotency check | `razorpay-verify-payment/index.ts` | Return success on duplicate verifications |
| Handle already_processed | `useRazorpayCheckout.ts` | Ensure redirect happens on retries |
| Verify order state | `useRazorpayCheckout.ts` | Confirm data is readable before redirect |

---

## Testing Checklist

After implementation:
1. Purchase power-up credits with billing info → Should redirect to success page
2. Refresh during payment → Should not create duplicate credits
3. Complete payment quickly → Should redirect without delay
4. Check billing_profiles table → Should have correct address data

---

## Files to Modify

1. `supabase/functions/razorpay-create-order/index.ts` - Fix billingData interface
2. `supabase/functions/razorpay-verify-payment/index.ts` - Add idempotency check
3. `src/hooks/useRazorpayCheckout.ts` - Improve error handling and add state verification
