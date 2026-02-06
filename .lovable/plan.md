

# Comprehensive Migration Plan: Cashfree to Razorpay

## Executive Summary

This migration replaces the entire Cashfree payment infrastructure with Razorpay, maintaining all existing functionality while leveraging Razorpay's robust subscription and payment APIs. The plan is designed for production robustness with proper error handling, idempotency, and signature verification.

---

## Current System Analysis

### Existing Functionality to Migrate

| Feature | Current Implementation | Business Logic |
|---------|----------------------|----------------|
| One-time orders | `cashfree-create-order` | Subscriptions and power-up credits |
| Recurring subscriptions | `cashfree-create-subscription` | Monthly auto-billing with card authorization |
| Subscription upgrades | `cashfree-upgrade-subscription` | Proration orders for plan upgrades |
| Subscription cancellation | `cashfree-cancel-subscription` | Cancel at period end |
| Payment verification | `cashfree-verify-payment` | Order status lookup |
| Webhook handling | `cashfree-webhook` | 14+ event types processed |

### Pricing Structure (USD)

```text
Subscriptions (Monthly):
- Launch: $149
- Pro: $199  
- Business: $499

Power-ups (per credit):
- Starter/Launch: $7.00
- Pro: $6.00
- Business: $5.00
```

---

## Razorpay API Overview (from Documentation)

### Key Differences from Cashfree

| Aspect | Cashfree | Razorpay |
|--------|----------|----------|
| **Authentication** | `x-client-id` + `x-client-secret` headers | Basic Auth (base64 of `key_id:key_secret`) |
| **API Base URL** | `api.cashfree.com/pg` | `api.razorpay.com/v1` |
| **Amount Format** | Dollars (50.00) | Smallest currency unit (5000 cents) |
| **Webhook Signature** | HMAC-SHA256 with timestamp prefix | HMAC-SHA256 of raw body only |
| **Subscription Plans** | Created in API call | Must be pre-created via API or Dashboard |
| **Order Flow** | Session ID for checkout | Order ID passed to checkout popup |
| **Verification** | Verify order status | Verify signature (`order_id|payment_id`) |

### Razorpay Order/Payment Flow

```text
1. Server: Create Order (POST /v1/orders) → Returns order_id
2. Client: Open Razorpay Checkout with order_id
3. Client: User completes payment → Checkout returns:
   - razorpay_payment_id
   - razorpay_order_id  
   - razorpay_signature
4. Server: Verify signature (HMAC-SHA256)
5. Webhook: Receive payment.captured event (backup confirmation)
```

### Razorpay Subscription Flow

```text
1. Pre-requisite: Create Plan (one-time, via API)
2. Server: Create Subscription (POST /v1/subscriptions) → Returns subscription_id + short_url
3. Client: Redirect to short_url for card authorization
4. Webhook: subscription.authenticated → First auth payment done
5. Webhook: subscription.activated → Subscription active
6. Webhook: subscription.charged → Each renewal
7. Webhook: subscription.cancelled/halted → Handle failures
```

---

## Implementation Plan

### Phase 1: Secrets Configuration

**Remove (after migration complete):**
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_ENVIRONMENT`

**Add (before starting):**
- `RAZORPAY_KEY_ID` - From Razorpay Dashboard > API Keys
- `RAZORPAY_KEY_SECRET` - From Razorpay Dashboard > API Keys
- `RAZORPAY_WEBHOOK_SECRET` - From Razorpay Dashboard > Webhooks > Secret

**Frontend Environment:**
- Replace `.env` variable:
```env
# Remove: VITE_CASHFREE_MODE=production
# Add:
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

---

### Phase 2: Razorpay Plan Creation

Before subscriptions work, plans must be created in Razorpay. This is a one-time setup via API:

```bash
# Create Launch Monthly Plan
curl -u YOUR_KEY_ID:YOUR_KEY_SECRET \
  -X POST https://api.razorpay.com/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "interval": 1,
    "item": {
      "name": "Solarizer Launch Monthly",
      "amount": 14900,
      "currency": "USD",
      "description": "Launch plan - 50 credits/month"
    },
    "notes": { "plan_type": "launch" }
  }'

# Repeat for Pro ($199 = 19900) and Business ($499 = 49900)
```

Store the returned `plan_id` values for use in edge functions.

---

### Phase 3: Database Schema Updates

**New columns to add:**

```sql
-- Migration: Add Razorpay columns alongside Cashfree columns
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS rz_order_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_signature TEXT;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS rz_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS rz_plan_id TEXT;

-- Rename/create events table for Razorpay
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  amount_cents INTEGER,
  status TEXT,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_subscription_events_sub_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_payment_id ON subscription_events(payment_id);
```

---

### Phase 4: Edge Functions

#### 4.1 `razorpay-create-order` (One-time Payments)

**Purpose:** Create orders for subscriptions and power-up purchases

**Key Implementation Details:**

```typescript
// Authentication helper
function getRazorpayAuth(): string {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  return "Basic " + btoa(`${keyId}:${keySecret}`);
}

// Create order
const response = await fetch("https://api.razorpay.com/v1/orders", {
  method: "POST",
  headers: {
    "Authorization": getRazorpayAuth(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: amountCents, // Amount in smallest currency unit
    currency: "USD",
    receipt: orderId, // Our internal order ID
    notes: {
      user_id: user.id,
      order_type: orderType,
      plan: plan || null,
    },
  }),
});

// Response contains: id (order_id to pass to checkout)
```

**Return to frontend:**
```json
{
  "success": true,
  "orderId": "our_internal_id",
  "rzOrderId": "order_RxxxxxxxxxxxxxxX",
  "amountCents": 19900,
  "currency": "USD",
  "keyId": "rzp_live_xxxx"
}
```

#### 4.2 `razorpay-create-subscription` (Recurring)

**Purpose:** Create recurring subscriptions with card authorization

```typescript
// Create subscription
const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
  method: "POST",
  headers: {
    "Authorization": getRazorpayAuth(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    plan_id: rzPlanId, // Pre-created plan ID
    total_count: 120, // 10 years of monthly billing
    quantity: 1,
    customer_notify: true,
    notes: {
      user_id: user.id,
      plan: plan,
    },
  }),
});

// Response contains:
// - id: subscription ID
// - short_url: URL to redirect user for card auth
// - status: "created"
```

#### 4.3 `razorpay-verify-payment` (Signature Verification)

**Critical for security - verify payment authenticity:**

```typescript
// Verify signature
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expectedSignature === signature;
}

// Usage
const isValid = verifyPaymentSignature(
  body.razorpay_order_id,
  body.razorpay_payment_id,
  body.razorpay_signature,
  Deno.env.get("RAZORPAY_KEY_SECRET")!
);

if (!isValid) {
  return new Response(
    JSON.stringify({ error: "Invalid payment signature" }),
    { status: 400 }
  );
}

// Process payment success...
```

#### 4.4 `razorpay-webhook` (Event Handler)

**Webhook signature verification:**

```typescript
async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC", key, encoder.encode(rawBody)
  );
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return computedSignature === signature;
}

// Get signature from header
const signature = req.headers.get("x-razorpay-signature");
const rawBody = await req.text();

if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
  return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
}
```

**Event handling mapping:**

| Razorpay Event | Action | DB Update |
|----------------|--------|-----------|
| `payment.authorized` | Log only (capture is auto) | None |
| `payment.captured` | Process payment success | `payment_orders.status = 'paid'`, add credits |
| `payment.failed` | Mark payment failed | `payment_orders.status = 'failed'` |
| `order.paid` | Backup confirmation | Verify order processed |
| `subscription.authenticated` | First auth done | Log event |
| `subscription.activated` | Activate subscription | `subscriptions.status = 'active'` |
| `subscription.charged` | Process renewal | Add credits, extend period |
| `subscription.pending` | Payment retrying | `subscriptions.status = 'past_due'` |
| `subscription.halted` | All retries failed | `subscriptions.status = 'past_due'` |
| `subscription.cancelled` | Cancelled | `subscriptions.status = 'canceled'` |
| `subscription.paused` | User paused | Log event |
| `subscription.resumed` | User resumed | `subscriptions.status = 'active'` |

**Idempotency handling:**

```typescript
// Use x-razorpay-event-id header for idempotency
const eventId = req.headers.get("x-razorpay-event-id");

// Check if already processed
const { data: existing } = await supabase
  .from("subscription_events")
  .select("id")
  .eq("event_id", eventId)
  .single();

if (existing) {
  return new Response(JSON.stringify({ success: true, already_processed: true }));
}
```

#### 4.5 `razorpay-cancel-subscription`

```typescript
// Cancel subscription (immediate or at cycle end)
const response = await fetch(
  `https://api.razorpay.com/v1/subscriptions/${rzSubscriptionId}/cancel`,
  {
    method: "POST",
    headers: {
      "Authorization": getRazorpayAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cancel_at_cycle_end: true, // false for immediate
    }),
  }
);
```

#### 4.6 `razorpay-upgrade-subscription`

Razorpay supports subscription updates via `PATCH /v1/subscriptions/:id`:

```typescript
// Update to new plan
const response = await fetch(
  `https://api.razorpay.com/v1/subscriptions/${rzSubscriptionId}`,
  {
    method: "PATCH",
    headers: {
      "Authorization": getRazorpayAuth(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: newPlanId,
      schedule_change_at: "now", // or "cycle_end"
      customer_notify: true,
    }),
  }
);
```

For proration, you can also:
1. Create a one-time order for the difference (like current Cashfree approach)
2. Use `schedule_change_at: "now"` to apply immediately

---

### Phase 5: Frontend Changes

#### 5.1 `index.html` - SDK Replacement

```html
<!-- Remove -->
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>

<!-- Add -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

#### 5.2 `useRazorpayCheckout.ts` - New Hook

```typescript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function useRazorpayCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = async (params: CreateOrderParams) => {
    setIsLoading(true);
    
    // 1. Create order via edge function
    const { data, error } = await invokeWithRefresh("razorpay-create-order", {
      body: params
    });

    if (error || !data?.rzOrderId) {
      toast.error("Failed to create order");
      setIsLoading(false);
      return false;
    }

    // 2. Open Razorpay Checkout
    const options: RazorpayOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: data.rzOrderId,
      amount: data.amountCents,
      currency: data.currency,
      name: "Solarizer",
      description: params.orderType === "subscription" 
        ? `${params.plan} Monthly Subscription`
        : `${params.creditsAmount} Credits Power-up`,
      handler: async (response) => {
        // 3. Verify payment on server
        const { data: verifyResult } = await invokeWithRefresh(
          "razorpay-verify-payment",
          {
            body: {
              order_id: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }
          }
        );
        
        if (verifyResult?.success) {
          window.location.href = `/payment-success?order_id=${data.orderId}`;
        } else {
          toast.error("Payment verification failed");
        }
        setIsLoading(false);
      },
      prefill: {
        email: user?.email,
      },
      theme: {
        color: "#3B82F6", // Brand color
      },
      modal: {
        ondismiss: () => {
          setIsLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    return true;
  };

  return { initiateCheckout, isLoading };
}
```

#### 5.3 `useRazorpaySubscription.ts` - Subscription Hook

```typescript
export function useRazorpaySubscription() {
  const createSubscription = async (plan: string) => {
    const { data, error } = await invokeWithRefresh(
      "razorpay-create-subscription",
      { body: { plan, billingPeriod: "monthly" } }
    );

    if (error || !data?.shortUrl) {
      toast.error("Failed to create subscription");
      return false;
    }

    // Redirect to Razorpay subscription page
    window.location.href = data.shortUrl;
    return true;
  };

  return { createSubscription };
}
```

#### 5.4 Update Import References

Files to update with new hook imports:
- `src/pages/Pricing.tsx`
- `src/components/UpgradeConfirmationModal.tsx`
- `src/components/PurchasePowerUpModal.tsx`

---

### Phase 6: config.toml Updates

```toml
# Remove
[functions.cashfree-create-order]
verify_jwt = false

[functions.cashfree-webhook]
verify_jwt = false

[functions.cashfree-verify-payment]
verify_jwt = false

# Add
[functions.razorpay-create-order]
verify_jwt = false

[functions.razorpay-create-subscription]
verify_jwt = false

[functions.razorpay-upgrade-subscription]
verify_jwt = false

[functions.razorpay-cancel-subscription]
verify_jwt = false

[functions.razorpay-verify-payment]
verify_jwt = false

[functions.razorpay-webhook]
verify_jwt = false
```

---

## Database Function Updates

Update these RPC functions to work with Razorpay fields:

1. **`activate_subscription`** - Change `p_cf_subscription_id` to `p_rz_subscription_id`
2. **`process_subscription_renewal`** - Handle Razorpay payment IDs
3. **`process_payment_success`** - Store `rz_payment_id`
4. **`create_payment_order`** - Add `p_rz_order_id` parameter

---

## Testing Checklist

### Sandbox Testing

1. **Orders Flow:**
   - [ ] Create one-time order
   - [ ] Complete payment in test mode
   - [ ] Verify signature validation
   - [ ] Confirm credits added

2. **Subscriptions Flow:**
   - [ ] Create subscription
   - [ ] Complete card authorization
   - [ ] Verify subscription.activated webhook
   - [ ] Test subscription.charged webhook
   - [ ] Test cancellation at period end
   - [ ] Test immediate cancellation

3. **Upgrades:**
   - [ ] Upgrade from Launch to Pro
   - [ ] Verify proration calculation
   - [ ] Confirm plan change

4. **Webhooks:**
   - [ ] Verify signature validation
   - [ ] Test idempotency (resend same event)
   - [ ] Confirm all event types handled

### Production Checklist

- [ ] Switch to live API keys
- [ ] Configure production webhook URL in Razorpay Dashboard
- [ ] Enable webhooks for all subscription and payment events
- [ ] Test with real payment (can refund)
- [ ] Monitor error logs

---

## Migration Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| 1. Preparation | 1 day | Razorpay account setup, API keys, plan creation |
| 2. Database | 0.5 day | Add new columns, create events table |
| 3. Edge Functions | 2-3 days | Create all 6 Razorpay functions |
| 4. Frontend | 1 day | SDK swap, new hooks, update components |
| 5. Testing | 1-2 days | Sandbox testing, edge cases |
| 6. Migration | 0.5 day | Switch to production, verify webhooks |
| 7. Cleanup | Post-migration | Remove Cashfree code after stable period |

**Total Estimated Time: 6-8 days**

---

## Rollback Plan

If issues arise:

1. Keep Cashfree functions and code in place (don't delete immediately)
2. Add feature flag to switch between payment providers
3. Maintain both `cf_*` and `rz_*` columns in database
4. Cashfree webhook can remain active during transition
5. Only remove Cashfree after 1+ billing cycle successfully processed via Razorpay

---

## Files Summary

| Category | Files | Action |
|----------|-------|--------|
| **Edge Functions (Delete)** | 7 Cashfree functions | Delete after migration |
| **Edge Functions (Create)** | 6 Razorpay functions | New implementations |
| **Frontend Hooks** | 2 hooks | Rewrite for Razorpay |
| **Pages** | PaymentSuccess, SubscriptionSuccess | Update params |
| **Components** | Modals, Pricing | Update imports |
| **Database** | 2 tables, 4+ functions | Add columns, update RPCs |
| **Config** | index.html, .env, config.toml | SDK and env changes |

