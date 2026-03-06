

# Comprehensive Plan: Free Trial System + Build Fixes + Social Links

This plan covers all changes in a single ordered execution.

---

## Part 1: Fix Pre-existing Build Errors (8 files)

### 1.1 `supabase/functions/_shared/apiKeyAuth.ts` (line 66)
Replace `.then().catch()` with `.then(() => {}, (err) => ...)` since `PromiseLike` lacks `.catch`.

### 1.2 `supabase/functions/_shared/razorpaySignature.ts` (lines 40, 63)
Cast `signatureBytes` and `encoder.encode(...)` args with `as unknown as BufferSource`.

### 1.3 `supabase/functions/_shared/verifyCallback.ts` (lines 54, 71, 76, 80)
Replace all `crypto.subtle.timingSafeEqual` with a manual XOR-based constant-time comparison function. Fix `null` → `string` mismatch on line 71 with `callbackSecret!`.

### 1.4 `supabase/functions/cli-audit-complete/index.ts` (line 119)
Cast findings array: `(body.findings || []) as Array<Record<string, unknown>>`.

### 1.5 `supabase/functions/cli-audit-start/index.ts` (lines 227, 244, 249)
Move `scopeNloc` and `contextNloc` declarations (lines 244, 249) above line 227.

### 1.6 `supabase/functions/cli-session-start/index.ts` (line 21-27)
Add `idempotency_key?: string;` to `SessionStartRequest` interface.

### 1.7 `supabase/functions/cli-session-end/index.ts` (line 73)
Cast `signature` as `signature as unknown as BufferSource`.

### 1.8 `supabase/functions/cli-session-progress/index.ts` (line 41)
Same BufferSource cast for `signature`.

---

## Part 2: Database Migrations (7 migrations)

### Migration 1: Schema changes
- `ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'trial'`
- Add `token_type` column to `access_tokens` with CHECK constraint
- Add `trial_activated_at` column to `profiles`

### Migration 2: `activate_trial` RPC
Create function that validates trial token, rejects if user has active sub or `trial_activated_at IS NOT NULL`, upserts subscription (plan=trial, 14 days), sets credits to 300, records redemption, sets `trial_activated_at`.

### Migration 3: Update `handle_new_user()` trigger
Already a no-op for subscriptions. Add `nloc_credits` insert with `credits_remaining = 0`.

### Migration 4: Guard `deduct_credits`
Add check: if plan is `trial` and `current_period_end < now()`, reject with "Trial expired".

### Migration 5: Guard `purchase_power_up`
Add check: if plan is `trial`, reject with "Trial users cannot purchase credits".

### Migration 6: Update `validate_access_token`
Return `token_type` in response JSON.

### Migration 7: Update `process_payment_success`
Change credit grants: starter→50, pro→100, business→200 for monthly subscriptions.

---

## Part 3: Edge Function Changes (2 files)

### 3.1 `supabase/functions/razorpay-create-order/index.ts`
Change `POWER_UP_RATES` to flat `100` cents for all plans.

### 3.2 `supabase/functions/cli-auth/index.ts`
- Fetch `current_period_end` alongside `plan, status`
- Map `trial` → `inferno` tier in response
- Reject if trial expired (`current_period_end < now()`)

---

## Part 4: Frontend Type Fixes (3 files)

### 4.1 `src/components/TrialActivationModal.tsx` (line 35)
Cast RPC name: `supabase.rpc("activate_trial" as any, ...)` until types regenerate.

### 4.2 `src/pages/dashboard/BillingPage.tsx` (line 265)
The `currentPlan` prop type on `SubscriptionPlanSelector` already accepts `"trial"`. The issue is that `subscription?.plan` type from generated types now includes `"trial"` but the component prop already handles it. Cast if needed: `currentPlan={(subscription?.plan || null) as any}`.

### 4.3 `src/pages/dashboard/SubscriptionPage.tsx` (line 76)
Same fix as BillingPage.

---

## Part 5: Social Links Update (1 file)

### 5.1 `src/components/Footer.tsx`
- X link already correct (`https://x.com/solarizer_io`)
- Add Telegram icon + link (`https://t.me/solarizer_ai`) next to the existing Mail and X icons

---

## Execution Order

1. Fix all 8 edge function build errors (Part 1)
2. Run 7 database migrations (Part 2)
3. Update 2 edge functions for trial + pricing (Part 3)
4. Fix 3 frontend type issues (Part 4)
5. Update Footer social links (Part 5)

**Total: ~15 file edits, 7 migrations**

