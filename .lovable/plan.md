

## Summary

Fix the subscription upgrade function that fails with the error **"ExpiresOn should be greater than First Charge Date"**. The issue is that when creating an upgrade subscription, the payment link expiry time (30 minutes from now) is set before the first charge date (current period end), which Cashfree rejects.

---

## Root Cause Analysis

| Field | Current Value | Problem |
|-------|--------------|---------|
| `subscription_expiry_time` | 30 minutes from now | This is when the payment link expires |
| `subscription_first_charge_time` | `current_period_end` (e.g., Feb 26) | First recurring charge date |

Cashfree requires: **expiry_time > first_charge_time**

But we're setting expiry to 30 mins from now, while first charge could be weeks away!

---

## Solution

For upgrade subscriptions, we need a different approach:

### Option 1: Charge Proration Immediately + Start New Subscription Cycle

1. Charge the proration difference as a one-time payment
2. Create a new subscription starting **immediately** (not at current period end)
3. The user's new plan takes effect right away

### Option 2: Fix Expiry Time to Be After First Charge

Set `subscription_expiry_time` to be after `subscription_first_charge_time`:

```typescript
// Calculate expiry time - must be after first charge time
const firstChargeTime = new Date(subscription.current_period_end || Date.now());
const expiryTime = new Date(firstChargeTime.getTime() + 60 * 60 * 1000); // 1 hour after first charge

subscription_expiry_time: expiryTime.toISOString(),
subscription_first_charge_time: firstChargeTime.toISOString(),
```

### Recommended: Hybrid Approach (Best UX)

For upgrades, we should:
1. **Charge the proration immediately** using a one-time order (not a subscription)
2. **Update the user's plan immediately** in the database
3. **Keep the existing billing cycle** - next full charge at `current_period_end`

This is actually what the code tries to do when `payment_method_saved` is true, but currently no users have saved payment methods.

---

## Implementation Plan

### File to Modify
`supabase/functions/cashfree-upgrade-subscription/index.ts`

### Changes

1. **Remove the subscription creation path for upgrades** - it's overly complex and causes the date issue

2. **Always use one-time order for proration**:
   - Create a one-time payment order for the proration amount
   - After payment success, update the subscription plan in database
   - Keep the same billing cycle end date
   - No need to create a new Cashfree subscription

3. **Fix the webhook to handle upgrade orders**:
   - When `order_type === "upgrade"` is processed, update the subscription plan

### Updated Flow

```text
User clicks "Upgrade to Pro"
         │
         ▼
┌─────────────────────────────────┐
│  Calculate proration            │
│  $199 - $149 = $50              │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Create one-time order ($50)    │
│  order_type: "upgrade"          │
│  Store target plan: "pro"       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User pays proration            │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Webhook receives SUCCESS       │
│  Update subscription.plan       │
│  Keep same billing_period_end   │
└─────────────────────────────────┘
```

---

## Code Changes

### 1. Update Upgrade Function (Simplified)

Always use one-time orders for upgrades instead of creating new subscriptions:

```typescript
// Remove the entire "new subscription" path (lines 201-293)
// Instead, always create a one-time order for proration

const orderId = `upgrade_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

const orderResponse = await fetch(`${cashfreeBaseUrl}/orders`, {
  method: "POST",
  headers: { /* ... */ },
  body: JSON.stringify({
    order_id: orderId,
    order_amount: prorationUSD,
    order_currency: "USD",
    customer_details: {
      customer_id: user.id,
      customer_email: profile?.email || user.email,
      customer_name: profile?.display_name || "Customer",
      customer_phone: "9999999999",
    },
    order_meta: {
      return_url: `${origin}/payment-success?order_id=${orderId}&upgrade=true&to_plan=${toPlan}`,
      notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
    },
    order_note: `Upgrade from ${currentPlan} to ${toPlan}`,
  }),
});
```

### 2. Update Webhook Handler for Upgrade Orders

In `cashfree-webhook/index.ts`, add handling for upgrade orders:

```typescript
if (order.order_type === "upgrade") {
  // Update subscription plan immediately
  const { error: updateError } = await supabaseClient
    .from("subscriptions")
    .update({ 
      plan: order.plan,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", order.user_id);
    
  if (updateError) {
    console.error("Failed to update subscription plan:", updateError);
  }
  
  // Log to subscription history
  await supabaseClient.from("subscription_history").insert({
    user_id: order.user_id,
    previous_plan: currentPlan, // Need to fetch this
    new_plan: order.plan,
  });
}
```

### 3. Handle `current_period_end` Being NULL

Add fallback handling for subscriptions where `current_period_end` is null:

```typescript
// If no period end, set it to 1 month from now (starter plans may not have this set)
const periodEnd = subscription.current_period_end 
  ? new Date(subscription.current_period_end)
  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
```

---

## Database Updates Needed

The `process_payment_success` RPC already handles `order_type = 'upgrade'` by updating the subscription plan, so no database changes are needed.

---

## Summary of Changes

| File | Change |
|------|--------|
| `cashfree-upgrade-subscription/index.ts` | Simplify to always use one-time orders for prorations |
| `cashfree-webhook/index.ts` | No changes needed (already logs upgrade payments) |
| `process_payment_success` RPC | No changes needed (handles upgrade order type) |

---

## Edge Cases Handled

1. **Starter plan users** (no `current_period_end`): Calculate 1 month from now
2. **Users without saved payment method**: Still works with one-time order flow
3. **Zero proration** (upgrading within same tier): Reject with error message

