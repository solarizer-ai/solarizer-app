

# Simplify Checkout: Remove Billing Info Modal

## What Changes

Remove the `BillingInfoModal` step from all checkout flows. Instead of collecting full address/phone/tax details before payment, just pass the customer's name and email (from their account) directly to Razorpay. Razorpay's hosted checkout page handles everything else.

## Why This Is Safe

- Razorpay's hosted checkout already collects payment details
- The billing_profiles table can stay in the database (no data loss) but won't be required for checkout
- Customer name and email are already available from the auth session

## Files to Change

### 1. `src/components/PurchasePowerUpModal.tsx`
- Remove `BillingInfoModal` import and usage
- Remove `showBillingModal` state
- Remove `handleBillingConfirm` -- merge into `handlePurchaseClick`
- Call `initiateCheckout` directly on purchase click (no billing modal step)
- Remove `billingData` from the checkout params

### 2. `src/pages/Pricing.tsx`
- Remove `BillingInfoModal` import and usage
- Remove `billingModalOpen` state
- Adjust subscription purchase flow to call checkout directly without billing modal

### 3. `src/hooks/useRazorpayCheckout.ts`
- Remove `billingData` from `CreateOrderParams` interface

### 4. `src/hooks/useRazorpaySubscription.ts`
- Remove `billingData` from subscription creation params (if present)

### 5. `supabase/functions/razorpay-create-order/index.ts`
- Remove `billingData` handling (the upsert to `billing_profiles`)
- Keep passing `customer.email` and add `customer.name` from user metadata to the Razorpay Payment Link

### 6. `src/types/billing.ts`
- Keep the file (types may be used elsewhere) but the `BillingData` type is no longer needed for checkout

### 7. `src/components/BillingInfoModal.tsx`
- Can be deleted entirely (no remaining consumers)

## What Stays

- The `billing_profiles` table remains in the database (no migration needed)
- The `useBillingProfile` hook stays (used on Settings/BillingHistory pages if applicable)

## User Impact

Clicking "Purchase" or "Subscribe" now goes straight to Razorpay's payment page -- no intermediate form. Faster checkout with less friction.
