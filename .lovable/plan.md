
## Summary

Implement full USD flow for Cashfree payments, completely removing INR conversion logic. Update all edge functions to send USD directly to Cashfree and enhance the subscription management with proper upgrade/downgrade functionality.

---

## Prerequisites (From Your Cashfree Dashboard)

Before implementation, confirm these Cashfree Plan IDs for USD billing:

| Plan | Expected Plan ID |
|------|------------------|
| Launch | `solarizer_launch_monthly_usd` |
| Pro | `solarizer_pro_monthly_usd` |
| Business | `solarizer_business_monthly_usd` |

If you're using different plan IDs, provide them and we'll update accordingly.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/cashfree-create-order/index.ts` | Remove INR conversion, send USD directly |
| `supabase/functions/cashfree-create-subscription/index.ts` | Change to USD pricing, update plan_currency to "USD" |
| `supabase/functions/cashfree-upgrade-subscription/index.ts` | Remove INR conversion, use USD for proration |
| `supabase/functions/cashfree-reactivate-subscription/index.ts` | Remove INR pricing, use USD |
| `supabase/functions/cashfree-webhook/index.ts` | Update amount handling for USD |
| `src/hooks/useCashfreeCheckout.ts` | Remove annual from type |

---

## 1. cashfree-create-order/index.ts (Power-up Credits)

### Current State (lines 119-125, 147-150)
```typescript
// Convert cents to INR (approximate conversion rate: 1 USD = 83 INR)
const USD_TO_INR_RATE = 83;
const amountDollars = amountCents / 100;
const amountINR = Math.round(amountDollars * USD_TO_INR_RATE);

// ...
order_amount: amountINR,
order_currency: "INR",
```

### Changes
```typescript
// Remove INR conversion entirely
const amountDollars = amountCents / 100;

// Send USD directly to Cashfree
order_amount: amountDollars,
order_currency: "USD",
```

### Response Update (lines 198-205)
```typescript
// BEFORE
orderAmount: amountINR,
orderCurrency: "INR",

// AFTER
orderAmount: amountDollars,
orderCurrency: "USD",
```

---

## 2. cashfree-create-subscription/index.ts

### Current State (lines 8-20)
```typescript
// Subscription prices in INR (converted from USD at 83 INR per USD)
const SUBSCRIPTION_PRICES_INR: Record<string, number> = {
  launch: 12367,     // $149 * 83
  pro: 16517,        // $199 * 83
  business: 41417,   // $499 * 83
};

const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly",
  pro: "solarizer_pro_monthly",
  business: "solarizer_business_monthly",
};
```

### Changes
```typescript
// Subscription prices in USD (dollars, not cents)
const SUBSCRIPTION_PRICES_USD: Record<string, number> = {
  launch: 149,
  pro: 199,
  business: 499,
};

// Updated plan IDs for USD (confirm with your Cashfree dashboard)
const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly_usd",
  pro: "solarizer_pro_monthly_usd",
  business: "solarizer_business_monthly_usd",
};
```

### Plan Details Update (lines 107-115)
```typescript
// BEFORE
plan_currency: "INR",
plan_recurring_amount: amountINR,

// AFTER
plan_currency: "USD",
plan_recurring_amount: amountUSD,
```

### Authorization Amount (lines 117-120)
```typescript
// BEFORE
authorization_amount: 100, // ₹1 for card verification

// AFTER
authorization_amount: 1, // $1 for card verification
```

### Order Recording (lines 164-174)
```typescript
// BEFORE
p_amount_cents: Math.round(amountINR / 83 * 100), // Convert back to USD cents

// AFTER
p_amount_cents: amountUSD * 100, // Store as USD cents directly
```

### Response Update (lines 176-186)
```typescript
// BEFORE
authAmount: 100,
amountINR,

// AFTER
authAmount: 1, // $1 authorization
amountUSD,
```

---

## 3. cashfree-upgrade-subscription/index.ts

### Current State (lines 8-27)
Contains both USD cents and INR pricing with conversion logic.

### Changes
```typescript
// Remove INR pricing entirely, keep USD cents only
const SUBSCRIPTION_PRICES: Record<string, number> = {
  launch: 14900,   // $149.00
  pro: 19900,      // $199.00
  business: 49900, // $499.00
};

// Updated plan IDs for USD
const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly_usd",
  pro: "solarizer_pro_monthly_usd",
  business: "solarizer_business_monthly_usd",
};
```

### Proration Order (lines 111, 151-154)
```typescript
// BEFORE
const prorationINR = Math.round((prorationCents / 100) * 83);
order_amount: prorationINR,
order_currency: "INR",

// AFTER
const prorationUSD = prorationCents / 100;
order_amount: prorationUSD,
order_currency: "USD",
```

### New Subscription (lines 229-237)
```typescript
// BEFORE
const newAmountINR = SUBSCRIPTION_PRICES_INR[toPlan];
plan_currency: "INR",
plan_recurring_amount: newAmountINR,
authorization_amount: prorationINR,

// AFTER
const newAmountUSD = SUBSCRIPTION_PRICES[toPlan] / 100; // Convert cents to dollars
plan_currency: "USD",
plan_recurring_amount: newAmountUSD,
authorization_amount: prorationUSD,
```

### Response Updates
```typescript
// BEFORE
prorationAmount: prorationINR,

// AFTER
prorationAmount: prorationUSD,
```

---

## 4. cashfree-reactivate-subscription/index.ts

### Current State (lines 8-19)
Contains INR pricing with annual plans.

### Changes
```typescript
// Remove all INR pricing and annual plans
const SUBSCRIPTION_PRICES_USD: Record<string, number> = {
  launch: 149,
  pro: 199,
  business: 499,
};

const CF_PLAN_IDS: Record<string, string> = {
  launch: "solarizer_launch_monthly_usd",
  pro: "solarizer_pro_monthly_usd",
  business: "solarizer_business_monthly_usd",
};
```

### Plan Details (lines 125-133)
```typescript
// BEFORE
plan_currency: "INR",
plan_recurring_amount: amountINR,
plan_max_cycles: billingPeriod === "annual" ? 10 : 120,
plan_intervals: billingPeriod === "annual" ? 12 : 1,

// AFTER
plan_currency: "USD",
plan_recurring_amount: amountUSD,
plan_max_cycles: 120,
plan_intervals: 1,
```

### Authorization Amount (lines 135-138)
```typescript
// BEFORE
authorization_amount: 100, // ₹1

// AFTER
authorization_amount: 1, // $1
```

### Order Recording (lines 171-181)
```typescript
// BEFORE
p_amount_cents: Math.round(amountINR / 83 * 100),

// AFTER
p_amount_cents: amountUSD * 100,
```

---

## 5. cashfree-webhook/index.ts

### Current State (line 212)
```typescript
const amountInr = data.subscription_amount || data.payment?.payment_amount;
```

### Changes
Rename to be currency-agnostic:
```typescript
const paymentAmount = data.subscription_amount || data.payment?.payment_amount;
```

And update the RPC call (line 226):
```typescript
// BEFORE
p_amount_inr: amountInr || null,

// AFTER - keep param name for backward compatibility but pass USD now
p_amount_inr: paymentAmount || null,
```

Note: The `process_subscription_renewal` RPC accepts `p_amount_inr` as a parameter name, but it's just stored for logging. No database schema change needed.

---

## 6. src/hooks/useCashfreeCheckout.ts

### Current State (line 16)
```typescript
billingPeriod?: "monthly" | "annual";
```

### Changes
```typescript
billingPeriod?: "monthly";
```

---

## Summary of USD Pricing

| Item | USD Amount |
|------|------------|
| Launch Plan | $149/mo |
| Pro Plan | $199/mo |
| Business Plan | $499/mo |
| Authorization (card verification) | $1 (refunded) |
| Power-up Credits (Launch) | $7/credit |
| Power-up Credits (Pro) | $6/credit |
| Power-up Credits (Business) | $5/credit |

---

## Technical Notes

1. **Cashfree USD Support**: Since you confirmed USD is approved for your merchant account, the API should accept `order_currency: "USD"` without issues.

2. **Plan IDs**: The plan IDs in Cashfree dashboard need to be configured for USD billing. The current plan IDs (`solarizer_pro_monthly`) may need to be recreated with USD currency, or you can use the same IDs if Cashfree allows multi-currency on the same plan.

3. **No Database Changes Needed**: All amounts are stored in USD cents in the `payment_orders.amount_cents` column already.

4. **Webhook Backward Compatibility**: The webhook will continue to work for any existing INR transactions while supporting new USD transactions.

5. **Upgrade/Downgrade Flow**: Already implemented correctly - upgrades charge proration immediately, downgrades are scheduled for period end with credit conversion.
