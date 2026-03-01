
# Zero-Amount Coupon: Skip Razorpay Flow

When a 100% coupon brings the final amount to $0 (or near-zero), bypass Razorpay entirely and fulfill the order directly.

## Current State

- **Upgrade flow** already handles this (checks `if (finalAmount < 100)` and does a direct upgrade)
- **Subscription and Power-up flows** do NOT handle this -- they always create a Razorpay Payment Link, which will fail or behave unexpectedly for $0 amounts

## Changes

### 1. Edge Function: `razorpay-create-order/index.ts`

After coupon validation and before creating the Razorpay Payment Link, add a zero-amount check:

- If `finalAmountCents < 100` (less than $1):
  - Create the payment order record with status tracking
  - Call `process_payment_success` RPC directly (with a synthetic payment ID like `coupon_free_{orderId}`) to fulfill the subscription or power-up
  - Record coupon redemption via `increment_coupon_used_count` and insert into `coupon_redemptions`
  - Return `{ success: true, flowType: "free_checkout", orderId }` instead of a payment URL

### 2. Frontend: `useRazorpaySubscription.ts` (createSubscription)

- After calling `razorpay-create-order`, check if `data.flowType === "free_checkout"`
- If so, show a success toast and invalidate subscription queries instead of redirecting to Razorpay

### 3. Frontend: `useRazorpayCheckout.ts` (power-up purchases)

- Same pattern: check for `flowType === "free_checkout"` in the response
- Show success toast and close the modal instead of redirecting

### 4. Frontend: Modals (SubscribeConfirmationModal, PurchasePowerUpModal, UpgradeConfirmationModal)

- Update button text to show "Confirm" instead of "Pay $0.00" when the final amount is $0

## Technical Details

The `process_payment_success` RPC already handles both `subscription` and `power_up` order types, including credit provisioning and subscription upsert. Reusing it for zero-amount orders ensures consistent fulfillment logic.

The upgrade flow in `razorpay-upgrade-subscription` already works correctly for zero amounts -- no changes needed there.
