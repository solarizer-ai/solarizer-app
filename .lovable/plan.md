
# Fix: 100% Coupon Not Working on Upgrade

## Problem

Two bugs prevent the zero-amount coupon from working on upgrades:

1. **BillingPage.tsx (line 385):** The `onConfirm` callback does NOT pass the coupon code to `upgradeSubscription`. It calls `upgradeSubscription({ toPlan: targetUpgradePlan })` without the `coupon_code` parameter, so the edge function never receives the coupon. (Pricing.tsx and SubscriptionPage.tsx correctly pass it.)

2. **Edge function `razorpay-upgrade-subscription` (lines 129-146):** When the amount is under $1 (direct upgrade path), it upgrades the plan but does NOT record the coupon redemption. This means the coupon's `used_count` isn't incremented and no `coupon_redemptions` row is created, allowing the coupon to be reused.

## Fix

### 1. `src/pages/dashboard/BillingPage.tsx` (line 385)

Change the `onConfirm` callback to accept and pass the coupon code:

```tsx
// Before:
onConfirm={async () => { setShowUpgradeModal(false); await upgradeSubscription({ toPlan: targetUpgradePlan }); }}

// After:
onConfirm={async (couponCode?: string) => { setShowUpgradeModal(false); await upgradeSubscription({ toPlan: targetUpgradePlan, coupon_code: couponCode }); }}
```

### 2. `supabase/functions/razorpay-upgrade-subscription/index.ts` (lines 129-146)

Add coupon redemption recording in the direct upgrade (zero-amount) path:

- After updating the subscription plan, if a `couponId` exists:
  - Call `increment_coupon_used_count` RPC
  - Insert a row into `coupon_redemptions` with the original and discounted amounts

This matches the pattern already used in `razorpay-create-order` for zero-amount subscription/power-up purchases.
