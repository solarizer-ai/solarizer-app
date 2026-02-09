

# Fix: Upgrade Payment Success Page Shows Wrong Info

## Problem

After upgrading from Launch to Business, the PaymentSuccess page shows:
- **"Power-up Credits"** instead of "Plan Upgrade"
- **"$NaN"** for Amount Paid (amountCents is null/undefined)
- Generic messaging instead of upgrade-specific copy

Two root causes:
1. The `razorpay-verify-payment` function may return null `amountCents` when the payment order isn't found or the field is missing, and the frontend's `formatAmount` doesn't handle null/undefined gracefully.
2. The PaymentSuccess page needs better upgrade-specific UI (title, description, and details section).

## Changes

### 1. `src/pages/PaymentSuccess.tsx` -- Better upgrade handling and null safety

- **formatAmount**: Guard against null/undefined/NaN values, show "N/A" instead of "$NaN"
- **Title**: Show "Upgrade Successful!" for upgrade orders instead of generic "Payment Successful!"
- **Description**: Show "You've been upgraded to [Plan]" for upgrades
- **Summary section**: Show upgrade-specific details (From Plan -> To Plan) instead of generic fields
- **Handle missing amountCents**: Don't render the "Amount Paid" row if value is invalid

### 2. `supabase/functions/razorpay-verify-payment/index.ts` -- Ensure amountCents is always valid

- Default `amountCents` to `0` if the value from the database is null
- Ensure `orderType` is always returned correctly from the order record

## Technical Details

### PaymentSuccess.tsx changes

```tsx
// Safe formatAmount
const formatAmount = (cents?: number | null) => {
  if (cents == null || isNaN(cents)) return null;
  return `$${(cents / 100).toFixed(2)}`;
};

// Dynamic title based on orderType
const getTitle = () => {
  if (paymentStatus?.orderType === "upgrade") return "Upgrade Successful!";
  if (paymentStatus?.orderType === "subscription") return "Subscription Activated!";
  return "Payment Successful!";
};

// Dynamic description
const getDescription = () => {
  if (paymentStatus?.orderType === "upgrade") {
    return `You've been upgraded to the ${getPlanDisplayName(paymentStatus.plan)} plan.`;
  }
  return "Thank you for your purchase. Your account has been updated.";
};

// Upgrade-specific summary showing plan name + billing
// Only show Amount Paid row when formatAmount returns a value
// Show "Plan" row for upgrade/subscription orders
```

### razorpay-verify-payment changes

- Ensure `amountCents` defaults to `0` when null: `amountCents: orderDetails?.amount_cents ?? 0`

### Files Modified

| File | Change |
|------|--------|
| `src/pages/PaymentSuccess.tsx` | Upgrade-specific UI, null-safe formatAmount, dynamic title/description |
| `supabase/functions/razorpay-verify-payment/index.ts` | Default amountCents to 0 when null |

