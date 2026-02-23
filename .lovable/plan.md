

# Razorpay Security Audit: Fix Plan

All 12 findings are confirmed valid. C1 is actually worse than reported -- the `process_subscription_renewal` RPC was dropped during the Cashfree-to-Razorpay migration, so subscription renewals throw an RPC error (not just a wrong-ID lookup).

---

## Phase 1: Critical Fixes

### C1. Renewal RPC is completely broken (not just wrong ID)

The `process_subscription_renewal` function was dropped in migration `20260216115209`. The `subscription.charged` webhook handler at line 255 calls a non-existent RPC. **Every renewal payment silently fails.**

**Fix:** Replace the RPC call in `razorpay-webhook/index.ts` (lines 247-259) with inline renewal logic:
1. Look up subscription by `rz_subscription_id`
2. Credit the user's account (50 credits for monthly, same as initial purchase logic in `process_payment_success`)
3. Log a `subscription_grant` transaction in `credit_txns`
4. Remove the dead `cf_subscription_id` select

### C2. `razorpay-create-order` returns success on DB failure

**Fix:** In `razorpay-create-order/index.ts` lines 166-168, return a 500 error response if `orderError` is truthy instead of falling through.

---

## Phase 2: High Priority

### H1. Hardcoded 30-day billing period

**Fix:** In `razorpay-webhook/index.ts`, read `current_start` and `current_end` from the subscription entity in both `.activated` and `.charged` handlers. Keep the 30-day calculation as fallback only.

### H2. No duplicate subscription prevention

**Fix:** In `razorpay-create-subscription/index.ts`, before calling the Razorpay API, query `subscriptions` for an existing `rz_subscription_id` where `status != 'canceled'`. Return 409 if found.

### H3. Currency verification (config only, no code change)

This is a configuration check: verify that international payments and USD are enabled on the Razorpay dashboard. If not, switch amounts to INR. **No code change needed unless switching currencies.**

---

## Phase 3: Shared Utilities (prerequisite for M1)

### L3. Extract shared modules

Create two shared modules to deduplicate code:

**`supabase/functions/_shared/razorpayAuth.ts`:**
- Extract `getRazorpayAuth()` (currently duplicated in 4 files)

**`supabase/functions/_shared/razorpaySignature.ts`:**
- Extract all signature verification functions
- Implement timing-safe comparison using `crypto.subtle.verify` (fixes M1)
- Export `verifyWebhookSignature`, `verifyPaymentLinkSignature`, `verifyOrderSignature`

---

## Phase 4: Medium Priority

### M1. Timing-unsafe signature comparison

**Fix:** Handled by L3 above. All three verification functions switch from `===` on hex strings to `crypto.subtle.verify()` which is constant-time.

Update imports in:
- `razorpay-webhook/index.ts`
- `razorpay-verify-payment/index.ts`
- `razorpay-callback/index.ts`

### M2. Hardcoded frontend URL

**Fix:** In `razorpay-create-order/index.ts` line 36 and `razorpay-upgrade-subscription/index.ts` lines 126-128, replace hardcoded URLs with:
```
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://solarizer-app.lovable.app";
```

A `FRONTEND_URL` secret will need to be added.

### M3. Missing webhook handlers

**Fix:** Add `subscription.completed` and `subscription.updated` cases to the switch in `razorpay-webhook/index.ts`:
- `.completed`: set status to `completed`
- `.updated`: sync `rz_plan_id` from the entity

### M4. Store subscription ID on `.authenticated`

**Fix:** Update the `subscription.authenticated` handler to upsert `rz_subscription_id` using `notes.user_id` from the entity.

---

## Phase 5: Low Priority

### L1. Plan ID fallback validation

**Fix:** In `razorpay-create-subscription/index.ts`, after resolving the plan ID, check if it starts with `plan_` (the placeholder prefix) and return 503 if so.

### L2. Clear signature from URL

**Fix:** In `src/pages/PaymentSuccess.tsx`, add a `useEffect` that calls `window.history.replaceState({}, "", "/payment-success")` after extracting query parameters.

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/_shared/razorpayAuth.ts` | New: shared auth utility |
| `supabase/functions/_shared/razorpaySignature.ts` | New: shared timing-safe signature verification |
| `supabase/functions/razorpay-webhook/index.ts` | C1 (inline renewal), H1 (billing dates), M3 (new handlers), M4 (authenticated handler), use shared imports |
| `supabase/functions/razorpay-create-order/index.ts` | C2 (error handling), M2 (frontend URL), use shared auth |
| `supabase/functions/razorpay-create-subscription/index.ts` | H2 (duplicate guard), L1 (plan validation), use shared auth |
| `supabase/functions/razorpay-verify-payment/index.ts` | Use shared signature verification |
| `supabase/functions/razorpay-callback/index.ts` | Use shared signature verification |
| `supabase/functions/razorpay-upgrade-subscription/index.ts` | M2 (frontend URL), use shared auth |
| `src/pages/PaymentSuccess.tsx` | L2 (clear signature from URL) |

## Secrets Required

- `FRONTEND_URL` -- needs to be set for M2

## No Database Migration Needed

All fixes are edge function and frontend code changes. No schema modifications required.

