

# Revised Plan: Fix Razorpay Full-Page Checkout

## Critical Finding from Documentation

After thorough research of Razorpay's official documentation, I discovered that the **Standard Checkout SDK with `callback_url` and `redirect: true` DOES work correctly for full-page redirects**, but there's a specific implementation detail that's been missed:

**Key Documentation Quote:**
> "redirect (optional) boolean - Determines whether to post a response to the event handler post payment completion or redirect to Callback URL. callback_url must be passed while using this parameter."
> - `true`: Customer is redirected to the specified callback URL in case of payment failure.
> - `false` (default): Customer is shown the Checkout popup to retry the payment with the suggested next best option.

The issue is that **Razorpay's modal-based checkout still opens first**, but it should POST to the callback URL after payment. The reason it's not working is likely:
1. The callback URL may not be allowlisted in the Razorpay Dashboard
2. The payment is completing but the redirect isn't happening due to configuration

## Two Valid Approaches

### Option A: Keep Standard Checkout (Modal) with Server Callback (Simpler)
The current implementation should work - the modal opens, user pays, then Razorpay POSTs to your callback. The issue is configuration.

### Option B: Use Payment Links API (True Full-Page Redirect)
For a completely different page where user leaves your site entirely, use the Payment Links API.

---

## Recommended Solution: Payment Links API (Option B)

Since you specifically want users to navigate to a completely different page (not a modal overlay), the **Payment Links API** is the correct approach.

### Implementation Steps

#### Step 1: Update Create Order to Use Payment Links API
**File**: `supabase/functions/razorpay-create-order/index.ts`

Replace the Orders API call with Payment Links API:

```typescript
// Change from: POST https://api.razorpay.com/v1/orders
// Change to:   POST https://api.razorpay.com/v1/payment_links

const callbackUrl = `${FRONTEND_URL}/payment-success`;

const rzResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
  method: "POST",
  headers: {
    Authorization: getRazorpayAuth(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: amountCents,
    currency: "USD",
    accept_partial: false,
    description: description,
    reference_id: orderId,  // Our internal order ID for lookup
    callback_url: callbackUrl,
    callback_method: "get",  // GET is easier to handle on frontend
    customer: {
      email: userEmail,
    },
    notify: {
      email: false,  // Don't send email notification
      sms: false,    // Don't send SMS notification
    },
    notes: {
      user_id: user.id,
      order_type: orderType,
      plan: plan || "",
      credits_amount: String(creditsAmount || 0),
    },
    expire_by: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  }),
});

const paymentLink = await rzResponse.json();
// Response: { id: "plink_xxx", short_url: "https://rzp.io/i/xxx", ... }
```

Return the payment URL:
```typescript
return new Response(JSON.stringify({
  success: true,
  orderId,
  paymentLinkId: paymentLink.id,
  paymentUrl: paymentLink.short_url,  // This is the full-page URL
}), { ... });
```

#### Step 2: Update Frontend to Simple Redirect
**File**: `src/hooks/useRazorpayCheckout.ts`

Remove all Razorpay SDK code and just redirect:

```typescript
export function useRazorpayCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = async (params: CreateOrderParams): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication Required", ... });
        return false;
      }

      const { data, error } = await invokeWithRefresh<CreateOrderResponse>(
        "razorpay-create-order",
        { body: params }
      );

      if (error || !data?.success) {
        toast({ title: "Order Creation Failed", ... });
        return false;
      }

      // Full-page redirect to Razorpay hosted checkout
      window.location.href = data.paymentUrl;
      return true;
    } catch (error) {
      toast({ title: "Checkout Error", ... });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { initiateCheckout, isLoading };
}
```

#### Step 3: Update Payment Success Page to Handle Callback
**File**: `src/pages/PaymentSuccess.tsx`

Payment Links callback comes as GET request with query params:
- `razorpay_payment_id`
- `razorpay_payment_link_id`
- `razorpay_payment_link_reference_id` (our `orderId`)
- `razorpay_payment_link_status`
- `razorpay_signature`

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("razorpay_payment_id");
  const linkId = params.get("razorpay_payment_link_id");
  const referenceId = params.get("razorpay_payment_link_reference_id");
  const status = params.get("razorpay_payment_link_status");
  const signature = params.get("razorpay_signature");

  if (paymentId && linkId && referenceId && signature) {
    // Verify payment with backend
    verifyPaymentLink({
      razorpay_payment_id: paymentId,
      razorpay_payment_link_id: linkId,
      razorpay_payment_link_reference_id: referenceId,
      razorpay_payment_link_status: status,
      razorpay_signature: signature,
    });
  }
}, []);
```

#### Step 4: Create/Update Verify Endpoint for Payment Links
**File**: `supabase/functions/razorpay-verify-payment/index.ts`

Update signature verification for Payment Links format:

```typescript
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
  const data = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  // ... HMAC verification logic
}
```

#### Step 5: Store Payment Link ID in Database
The `payment_orders` table needs to store `rz_payment_link_id`:

```sql
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS rz_payment_link_id TEXT;
```

---

## Technical Details

### Payment Links API Response Structure
```json
{
  "id": "plink_ExjpAUN3gVHrPJ",
  "amount": 1000,
  "currency": "USD",
  "description": "Payment for credits",
  "reference_id": "order_123456_abc12345",
  "short_url": "https://rzp.io/i/nxrHnLJ",
  "status": "created",
  "callback_url": "https://solarizer-app.lovable.app/payment-success",
  "callback_method": "get"
}
```

### Callback Query Parameters (on success)
```
/payment-success?razorpay_payment_id=pay_xxx
                &razorpay_payment_link_id=plink_xxx
                &razorpay_payment_link_reference_id=order_123456_abc
                &razorpay_payment_link_status=paid
                &razorpay_signature=abc123...
```

### Signature Verification Formula
```
generated_signature = hmac_sha256(
  payment_link_id + "|" + reference_id + "|" + status + "|" + payment_id,
  key_secret
)
```

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/razorpay-create-order/index.ts` | Modify | Use Payment Links API instead of Orders API |
| `src/hooks/useRazorpayCheckout.ts` | Modify | Remove SDK, use simple redirect |
| `supabase/functions/razorpay-verify-payment/index.ts` | Modify | Update signature verification for Payment Links |
| `src/pages/PaymentSuccess.tsx` | Modify | Handle Payment Links callback params |
| Database migration | Create | Add `rz_payment_link_id` column |

---

## Edge Cases Handled

1. **Idempotency**: Check if order is already `paid` before processing
2. **Expired Links**: Set `expire_by` to 1 hour to prevent stale links
3. **Signature Verification**: Always verify before processing payment
4. **Failed Payments**: Payment Links redirect back with error info in query params
5. **Webhook Backup**: Razorpay webhooks (`payment_link.paid`) provide backup verification

---

## Post-Implementation Steps

1. **No Dashboard Configuration Needed** - Payment Links use the `callback_url` parameter directly, no allowlisting required
2. **Test with Test Mode** - Use Razorpay test credentials first
3. **Monitor Logs** - Check edge function logs for any issues

---

## Comparison: Standard Checkout vs Payment Links

| Feature | Standard Checkout | Payment Links |
|---------|------------------|---------------|
| UI | Modal overlay on your page | Full-page redirect to Razorpay |
| SDK Required | Yes (checkout.js) | No |
| Signature Format | `order_id\|payment_id` | `link_id\|ref_id\|status\|payment_id` |
| Callback Config | Must allowlist in Dashboard | Passed in API request |
| Best For | Seamless in-page experience | Clean separation, mobile-friendly |

