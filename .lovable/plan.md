
# Payment Links Only (Pre-Stripe Bridge)

8 changes across 6 files. No new database migration needed — the existing `cancel_subscription` RPC already sets `cancel_at_period_end = true` and returns `access_until` without calling any external API.

---

## 1. Fix PLAN_PRICES key mismatch (CRITICAL)

**File:** `supabase/functions/razorpay-create-order/index.ts`

Change `launch: 14900` to `starter: 14900` in the `PLAN_PRICES` map (line 24). This fixes all Spark plan purchases failing with `undefined` amount.

---

## 2. Rewire subscription creation to Payment Links

**File:** `src/hooks/useRazorpaySubscription.ts`

In `createSubscription()` (lines 67-88):
- Change the edge function call from `razorpay-create-subscription` to `razorpay-create-order`
- Send `{ orderType: "subscription", plan, billingPeriod }` as the body
- Redirect to `data.paymentUrl` instead of `data.shortUrl`

The return flow already works: `/payment-success` calls `razorpay-verify-payment` which calls `process_payment_success` RPC, which handles `order_type = 'subscription'` (grants 50 credits, sets plan, sets 30-day period).

---

## 3. Simplify cancel (no Razorpay API call)

**File:** `src/hooks/useRazorpaySubscription.ts`

In `cancelSubscription()` (lines 232-269):
- Replace the `invokeWithRefresh("razorpay-cancel-subscription", ...)` call with `supabase.rpc("cancel_subscription")`
- The existing `cancel_subscription` RPC already does exactly what we need: sets `cancel_at_period_end = true` and returns `access_until`
- No new migration needed

---

## 4. Replace downgrade with informational toast

**File:** `src/pages/Pricing.tsx`

In `getButtonConfig()` (lines 209-218):
- Replace the downgrade action with a toast: "To switch to this plan, select it when your current plan expires."
- Change button text to "Switch at Renewal"
- Remove `DowngradeWarningModal` import/component, `downgradeModalOpen` state, `targetDowngradePlan` state, and `handleConfirmDowngrade` function

---

## 5. UI text: "Renews" to "Expires"

Three files:

**`src/components/settings/SubscriptionPlanSelector.tsx`** (line 144):
- `Renews {format(...)}` to `Expires {format(...)}`

**`src/pages/Settings.tsx`** (line 322):
- `Renews on` to `Expires on`

**`src/pages/Settings.tsx`** (line 395):
- `Next billing:` to `Expires:`

---

## 6. Redirect SubscriptionSuccess page

**File:** `src/pages/SubscriptionSuccess.tsx`

Replace the entire page content with a simple redirect to `/pricing`. Users now land on `/payment-success` after paying, so this page is dead code.

---

## 7. Add "Renew Plan" button near expiry

**File:** `src/components/settings/SubscriptionPlanSelector.tsx`

- Add `onRenew?: (planId: string) => void` prop
- Compute `isNearExpiry` (within 7 days or past)
- Show a "Renew Plan" button on the current plan row when near expiry

**File:** `src/pages/dashboard/SubscriptionPage.tsx`
**File:** `src/pages/dashboard/BillingPage.tsx`

Both pass `onRenew` prop that calls `createSubscription({ plan: planId, billingPeriod: 'monthly' })`.

---

## 8. Deploy

Deploy `razorpay-create-order` edge function (the only edge function modified).

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/razorpay-create-order/index.ts` | Fix `launch` to `starter` key |
| `src/hooks/useRazorpaySubscription.ts` | Rewire to Payment Links, simplify cancel |
| `src/pages/Pricing.tsx` | Remove downgrade modal, toast instead |
| `src/components/settings/SubscriptionPlanSelector.tsx` | "Expires" label, Renew button |
| `src/pages/Settings.tsx` | "Expires" labels |
| `src/pages/dashboard/BillingPage.tsx` | Pass `onRenew` prop |
| `src/pages/dashboard/SubscriptionPage.tsx` | Pass `onRenew` prop |
| `src/pages/SubscriptionSuccess.tsx` | Redirect to `/pricing` |

## Not Modified (per spec)

- `razorpay-create-subscription` -- kept as dead code
- `razorpay-cancel-subscription` -- kept as dead code
- `razorpay-upgrade-subscription` -- already works via Payment Links
- `razorpay-webhook` -- still handles `payment.captured`
- No new database migration (existing `cancel_subscription` RPC suffices)
