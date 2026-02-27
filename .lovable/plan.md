

# Impact of One-Time Payment Links (No Razorpay Subscriptions)

## Summary

Since you're using **one-time Payment Links** for everything (including plan purchases), the Razorpay Subscription API is completely unused. Several edge functions, secrets, webhook handlers, and DB columns are now dead code.

## What's Already Correct

These are already aligned with one-time payments:

- **`razorpay-create-order`** -- Creates Payment Links for subscriptions, power-ups, and upgrades. This is the correct entry point.
- **`razorpay-verify-payment`** -- Verifies Payment Link signatures and calls `process_payment_success`. Correct.
- **`razorpay-upgrade-subscription`** -- Despite its name, it already creates a Payment Link (not a Razorpay subscription). Works correctly.
- **`useRazorpaySubscription.ts` hook** -- `createSubscription()` already calls `razorpay-create-order` (not `razorpay-create-subscription`). `cancelSubscription()` uses a local RPC (no Razorpay API). Both correct.
- **`SubscriptionPlanSelector`** -- Already shows "Expires on" instead of "Renews on". Correct.

## What Needs to Change

### 1. Delete Dead Edge Function: `razorpay-create-subscription`
This function creates actual Razorpay Subscriptions using plan IDs (`RAZORPAY_PLAN_LAUNCH`, `RAZORPAY_PLAN_PRO`, `RAZORPAY_PLAN_BUSINESS`). It is **never called** from the frontend -- `useRazorpaySubscription.createSubscription()` calls `razorpay-create-order` instead. Delete it.

### 2. Delete Dead Edge Function: `razorpay-cancel-subscription`
This function calls `Razorpay API /v1/subscriptions/{id}/cancel`. Since there are no Razorpay subscriptions to cancel (plans expire naturally), this is dead code. The frontend `cancelSubscription()` already uses the local `cancel_subscription` RPC. Delete it.

### 3. Clean Up Webhook Handler: `razorpay-webhook`
The webhook has ~10 `subscription.*` event handlers (authenticated, activated, charged, pending, halted, cancelled, paused, resumed, completed, updated). With one-time payments, **none of these will ever fire**. The only relevant handlers are:
- `payment.captured` -- still valid for Payment Link payments
- `payment.failed` -- still valid
- `order.paid` -- still valid

**Action**: Remove all `subscription.*` cases from the switch statement.

### 4. Remove Unused Secrets (3 secrets)
These Razorpay plan ID secrets are only used by the deleted `razorpay-create-subscription`:
- `RAZORPAY_PLAN_LAUNCH`
- `RAZORPAY_PLAN_PRO`  
- `RAZORPAY_PLAN_BUSINESS`

They can be removed from the project secrets.

### 5. Remove Unused DB Columns
The `subscriptions` table has columns only used by Razorpay Subscriptions:
- `rz_subscription_id` -- Razorpay subscription ID (never set with Payment Links)
- `rz_plan_id` -- Razorpay plan ID (never set with Payment Links)
- `payment_method_saved` -- only set by `subscription.activated` webhook (dead code)

**Action**: Drop these 3 columns via migration.

### 6. Remove Dead RPC: `reactivate_subscription`
This RPC sets `cancel_at_period_end = FALSE`. With one-time payments that simply expire, there's no auto-renewal to "reactivate." The concept doesn't apply. The frontend calls it but it's a no-op in the one-time model.

Similarly, `cancel_subscription` RPC sets `cancel_at_period_end = TRUE` -- but with no auto-renewal, this flag is meaningless. However, the UI uses it to show "Cancellation Scheduled" state, so it still has UX value (user explicitly opting not to renew). Keep it but consider renaming conceptually.

### 7. Remove `subscription_events` table references
The `subscription_events` table stores Razorpay webhook events for idempotency. With subscription webhooks removed, only `payment.captured` / `payment.failed` events will use it. The table itself can stay (it's still useful for idempotency on payment webhooks), but the subscription-specific columns (`subscription_id`) become less relevant.

## File Changes Summary

| Action | File | Reason |
|--------|------|--------|
| Delete | `supabase/functions/razorpay-create-subscription/index.ts` | Dead code, never called |
| Delete | `supabase/functions/razorpay-cancel-subscription/index.ts` | Dead code, no RZ subscriptions to cancel |
| Modify | `supabase/functions/razorpay-webhook/index.ts` | Remove all `subscription.*` cases |
| Migration | Drop `rz_subscription_id`, `rz_plan_id`, `payment_method_saved` from subscriptions | Unused columns |
| Remove | Secrets: `RAZORPAY_PLAN_LAUNCH`, `RAZORPAY_PLAN_PRO`, `RAZORPAY_PLAN_BUSINESS` | No longer needed |
| Optional | Rename `razorpay-upgrade-subscription` to something clearer (e.g., `razorpay-create-upgrade-order`) | Clarity, but not breaking |

## No Changes Needed

- `razorpay-create-order` -- already correct
- `razorpay-verify-payment` -- already correct  
- `razorpay-callback` -- already correct (handles Payment Link callbacks)
- `useRazorpaySubscription.ts` -- already routes through `razorpay-create-order`
- `useRazorpayCheckout.ts` -- already correct
- `process_payment_success` RPC -- already handles subscription/power_up/upgrade
- Pricing page and SubscriptionPlanSelector -- already aligned

