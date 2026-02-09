
# Plan: Switch Razorpay Checkout from Modal to Full-Page Redirect

## Current Behavior
The Razorpay checkout opens as a popup/modal overlay on the same page (as shown in your screenshot). This is the default "Standard Checkout" behavior.

## Desired Behavior
Redirect users to Razorpay's hosted payment page in a full browser navigation, then redirect back to your success page after payment.

## Solution Overview
Add `callback_url` and `redirect: true` options to the Razorpay checkout configuration. This requires creating a new server-side endpoint to handle Razorpay's POST callback.

---

## Implementation Steps

### Step 1: Create a New Edge Function for Callback Handling
**File**: `supabase/functions/razorpay-callback/index.ts`

This endpoint will:
1. Receive POST from Razorpay with payment details
2. Extract our internal `order_id` from Razorpay's order notes
3. Verify the payment signature
4. Process the payment
5. Redirect the user to `/payment-success?order_id=xxx`

```text
Razorpay POST → razorpay-callback → Verify & Process → Redirect to /payment-success
```

### Step 2: Update Edge Function to Return Callback URL
**File**: `supabase/functions/razorpay-create-order/index.ts`

Return the callback URL in the response so the frontend can use it:
- Add `callbackUrl` to response: `https://xylfnqrtzqfduutdcxvu.supabase.co/functions/v1/razorpay-callback`

### Step 3: Update Frontend Checkout Hook
**File**: `src/hooks/useRazorpayCheckout.ts`

Modify the Razorpay options to include:
- `callback_url`: The edge function URL that handles the redirect
- `redirect: true`: Enables full-page redirect mode

Remove the `handler` function since it won't be used in redirect mode.

### Step 4: Allowlist Callback URL in Razorpay Dashboard
You'll need to add the callback URL to your Razorpay dashboard's allowlisted URLs:
- Go to Razorpay Dashboard → Settings → Checkout Configuration
- Add: `https://xylfnqrtzqfduutdcxvu.supabase.co/functions/v1/razorpay-callback`

---

## Technical Details

### New Callback Flow

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   User      │───►│  Razorpay    │───►│  razorpay-callback  │───►│ /payment-success│
│ clicks Pay  │    │  full page   │    │  (edge function)    │    │    (frontend)   │
└─────────────┘    │  checkout    │    │                     │    └─────────────────┘
                   └──────────────┘    │ 1. Parse POST body  │
                                       │ 2. Get order_id     │
                                       │ 3. Verify signature │
                                       │ 4. Process payment  │
                                       │ 5. 302 redirect     │
                                       └─────────────────────┘
```

### Callback Edge Function Logic

1. Parse `application/x-www-form-urlencoded` POST body from Razorpay
2. Extract `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
3. Fetch our internal `order_id` from `payment_orders` table using `rz_order_id`
4. Verify HMAC signature
5. Call `process_payment_success` RPC
6. Return HTTP 302 redirect to `/payment-success?order_id=xxx`

### Frontend Changes

| Current | New |
|---------|-----|
| `handler: function(response) {...}` | Removed (not used in redirect mode) |
| Modal opens on page | Full-page redirect to Razorpay |
| JavaScript handles response | Server handles POST callback |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/razorpay-callback/index.ts` | Create | Handle POST callback from Razorpay |
| `supabase/functions/razorpay-create-order/index.ts` | Modify | Return callback URL |
| `src/hooks/useRazorpayCheckout.ts` | Modify | Add callback_url and redirect options |

---

## Post-Implementation Steps

1. **Deploy the new edge function** (automatic)
2. **Allowlist the callback URL** in Razorpay Dashboard:
   - Navigate to: Settings → Checkout Configuration → Callback URL
   - Add: `https://xylfnqrtzqfduutdcxvu.supabase.co/functions/v1/razorpay-callback`
3. **Test the full flow** with a test payment
