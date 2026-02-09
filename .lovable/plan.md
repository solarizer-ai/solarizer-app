

# Fix: Unify Plan Naming + Settings Hook + Proration Bug

## Overview

Three fixes in one pass:
1. **Settings page** still uses the old Cashfree hook -- swap to Razorpay
2. **Proration amount bug** -- `starter` mapped to `$0` instead of `$149`
3. **Unify plan naming** -- eliminate the dual `"starter"` / `"launch"` terminology

## Plan Naming Decision

The database enum is `('starter', 'pro', 'business')` -- changing it would require a migration and risk breaking existing data. So **`starter` becomes the single canonical identifier everywhere in code**. The word "Launch" only appears in **display labels** (UI text shown to users).

This eliminates all the messy `launch`-to-`starter` conversions scattered across the codebase.

## Changes by File

### Backend (Edge Functions)

| File | Change |
|------|--------|
| `supabase/functions/razorpay-upgrade-subscription/index.ts` | Fix `PLAN_PRICES`: set `starter: 14900`. Remove `launch` key. Fix interface type from `"pro" \| "business"` to include `"starter"`. |
| `supabase/functions/razorpay-create-subscription/index.ts` | Change interface from `"launch"` to `"starter"`. Change `RAZORPAY_PLAN_IDS` key from `launch` to `starter`. |
| `supabase/functions/razorpay-create-order/index.ts` | Change interface plan type from `"launch"` to `"starter"`. |
| `supabase/functions/razorpay-webhook/index.ts` | Change default plan fallback from `"launch"` to `"starter"`. |
| `supabase/functions/cashfree-create-subscription/index.ts` | Change interface from `"launch"` to `"starter"`. |
| `supabase/functions/cashfree-create-order/index.ts` | Change interface from `"launch"` to `"starter"`. |

### Frontend (Hooks)

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | (1) Swap `useCashfreeSubscription` to `useRazorpaySubscription`. (2) Change all `"launch"` type annotations to `"starter"`. Remove all `launch`-to-`starter` conversion logic. |
| `src/hooks/useRazorpaySubscription.ts` | Change `CreateSubscriptionParams.plan` from `"launch"` to `"starter"`. |
| `src/hooks/useRazorpayCheckout.ts` | Change `CreateOrderParams.plan` from `"launch"` to `"starter"`. |
| `src/hooks/useCashfreeSubscription.ts` | Change interface from `"launch"` to `"starter"`. |
| `src/hooks/useCashfreeCheckout.ts` | Change interface from `"launch"` to `"starter"`. |

### Frontend (Components)

| File | Change |
|------|--------|
| `src/components/settings/SubscriptionPlanSelector.tsx` | Change `Plan.id` type and PLANS array to use `"starter"` instead of `"launch"`. Remove `normalizedCurrentPlan` / `normalizedPending` mappings. Keep display name as "Launch". |
| `src/components/UpgradeConfirmationModal.tsx` | Remove `"launch"` check -- just `"starter"` maps to "Launch" display. |
| `src/components/CancelSubscriptionModal.tsx` | Already uses `"starter"` -> "Launch" display. No change needed. |
| `src/components/DowngradeWarningModal.tsx` | Already uses `"starter"` -> "Launch" display. No change needed. |

### Frontend (Pages)

| File | Change |
|------|--------|
| `src/pages/Pricing.tsx` | Remove `launch`-to-`starter` conversion in `handleConfirmDowngrade`. Use `"starter"` directly. |
| `src/pages/SubscriptionSuccess.tsx` | Already handles `"starter"` display. No change needed. |

### Lib

| File | Change |
|------|--------|
| `src/lib/nlocCalculator.ts` | Remove duplicate `launch` entries from `SUBSCRIPTION_CREDITS` and `PLAN_CREDIT_RATES`. Keep only `starter`. |

## Summary of What Gets Eliminated

- All `"launch" | "pro" | "business"` type unions become `"starter" | "pro" | "business"`
- All `targetDowngradePlan === "launch" ? "starter" : targetDowngradePlan` conversions are removed
- All `currentPlan === "starter" ? "launch" : currentPlan` normalizations are removed
- The `PLAN_PRICES` / `PLAN_ORDER` mappings no longer need both `starter` and `launch` keys
- Display name mapping stays: `starter` -> "Launch" in UI labels only
