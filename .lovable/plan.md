

# Add Coupon Code Support to Subscription & Upgrade Flows

## Current State
- CouponInput component exists and works in PurchasePowerUpModal
- `razorpay-create-order` edge function already accepts `coupon_code` and applies discounts
- `razorpay-upgrade-subscription` edge function does NOT yet accept `coupon_code`
- Pricing page and SubscriptionPage call `createSubscription()` without any coupon support
- UpgradeConfirmationModal has no coupon input

## Changes

### 1. Update `useRazorpaySubscription` hook to accept coupon codes
- Add `coupon_code?: string` to `CreateSubscriptionParams`
- Pass it through to `razorpay-create-order` in `createSubscription()`
- Add `coupon_code?: string` to `UpgradeParams`
- Pass it through to `razorpay-upgrade-subscription` in `upgradeSubscription()`

### 2. Add coupon input to Pricing page subscription flow
- When a logged-in user without a subscription clicks "Subscribe", show a confirmation dialog (new small modal) with:
  - Plan name and price summary
  - CouponInput component
  - "Subscribe" and "Cancel" buttons
- Pass the coupon code to `createSubscription()`

### 3. Add coupon input to UpgradeConfirmationModal
- Add CouponInput below the proration info section
- Track applied coupon state, show discounted total
- Pass coupon code through `onConfirm` callback to the parent

### 4. Add coupon input to SubscriptionPage (billing page)
- The billing page already uses UpgradeConfirmationModal (change from step 3 covers it)
- For new subscription from billing page, it navigates to `/pricing`, so step 2 covers it

### 5. Update `razorpay-upgrade-subscription` edge function
- Add `coupon_code` support mirroring `razorpay-create-order` logic (validate via `validate_coupon` RPC, apply discount to Payment Link amount, store in metadata)

## Technical Details

### New component: `SubscribeConfirmationModal`
A small dialog shown when subscribing from Pricing page, containing:
- Plan name, price display
- CouponInput (orderType="subscription", amountCents from plan price)
- Subscribe button that calls `createSubscription({ plan, billingPeriod, coupon_code })`

### UpgradeConfirmationModal changes
- Add `coupon_code` to `onConfirm` callback signature: `onConfirm(couponCode?: string)`
- Add CouponInput with `orderType="subscription"` and `amountCents={prorationAmount}`
- Display discounted total when coupon applied

### Edge function: `razorpay-upgrade-subscription`
- Accept `coupon_code` in request body
- Call `validate_coupon` RPC before creating Payment Link
- Apply discount to the Payment Link amount
- Store `coupon_id` and `original_amount_cents` in `payment_orders.metadata`

## Files Modified
| File | Change |
|------|--------|
| `src/hooks/useRazorpaySubscription.ts` | Add `coupon_code` to params |
| `src/pages/Pricing.tsx` | Add SubscribeConfirmationModal before checkout |
| `src/components/UpgradeConfirmationModal.tsx` | Add CouponInput |
| `src/pages/dashboard/SubscriptionPage.tsx` | Pass coupon through upgrade modal |
| `supabase/functions/razorpay-upgrade-subscription/index.ts` | Add coupon support |
| New: `src/components/SubscribeConfirmationModal.tsx` | Confirmation dialog with coupon input |

