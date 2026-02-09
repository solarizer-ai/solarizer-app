

# Fix: Upgrade Success Page Display + Plan Update Reliability

## Problems Found

### 1. Success page shows "Starter" instead of "Launch"
The `getPlanDisplayName` function just capitalizes the first letter, so `"starter"` becomes `"Starter"`. It needs to map `"starter"` to `"Launch"`.

### 2. Race condition between webhook and verify-payment
When payment completes, two things happen nearly simultaneously:
- The **webhook** fires `payment.captured`
- The user is redirected to `/payment-success`, which calls **verify-payment**

The webhook tries to find the order by `rz_order_id`, but upgrade orders use Payment Links (not standard Razorpay orders), so they only have `rz_payment_link_id`. The webhook can't find the order and does nothing.

However, if the webhook DID find and process the order first (marking it `paid`), verify-payment would hit the "already processed" early return (line 109) and skip the subscription upgrade entirely.

### 3. Webhook doesn't handle Payment Link events for upgrades
The `payment.captured` handler looks up orders by `rz_order_id`, but Payment Link orders don't have a Razorpay order_id stored in that column -- they use `rz_payment_link_id`. So the webhook never processes upgrade payments.

## Changes

### File 1: `src/pages/PaymentSuccess.tsx`
- Update `getPlanDisplayName` to map `"starter"` to `"Launch"` display name

### File 2: `supabase/functions/razorpay-verify-payment/index.ts`
- In the "already processed" early return (when `status === 'paid'`), also check if the upgrade was applied. If the order is an upgrade and the subscription still has the old plan, perform the upgrade before returning.

### File 3: `supabase/functions/razorpay-webhook/index.ts`
- In the `payment.captured` handler, after failing to find by `rz_order_id`, add a fallback lookup using Payment Link notes (the `reference_id` from the payment entity notes contains our `order_id`)
- When an upgrade order is found via webhook, update the subscription plan (same logic as verify-payment)

## Technical Detail

```text
Current flow (broken for upgrades):
  Webhook (payment.captured)
    -> lookup by rz_order_id -> NOT FOUND -> does nothing
  verify-payment
    -> lookup by order_id (reference_id) -> FOUND
    -> process_payment_success -> upgrade plan -> return success

Fixed flow:
  Webhook (payment.captured)
    -> lookup by rz_order_id -> NOT FOUND
    -> fallback: extract reference_id from notes -> lookup by order_id
    -> process_payment_success + upgrade plan
  verify-payment
    -> already_processed? -> YES
    -> check if upgrade was applied -> if not, apply it
    -> return correct orderType/plan/amount
```

| File | Change |
|------|--------|
| `src/pages/PaymentSuccess.tsx` | Map `"starter"` to `"Launch"` in display |
| `supabase/functions/razorpay-verify-payment/index.ts` | Handle upgrade in "already processed" path |
| `supabase/functions/razorpay-webhook/index.ts` | Add fallback order lookup for Payment Link payments; apply upgrade on match |
