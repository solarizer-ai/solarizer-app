

# Fix: Subscription Upgrade Uses Old SDK Modal (Same Issue as Power-Ups)

## Problem

The **upgrade subscription** flow still uses the old Razorpay Orders API + JavaScript SDK modal checkout, which was the same broken pattern we just fixed for power-ups. Specifically:

- `razorpay-upgrade-subscription` creates a Razorpay **Order** (not a Payment Link)
- `useRazorpaySubscription.ts` tries to open `window.Razorpay` SDK modal with the order
- This fails because the SDK modal approach doesn't work reliably

The **create subscription** flow (first-time subscribers) already works fine -- it redirects to Razorpay's hosted subscription page via `shortUrl`.

## Solution

Route upgrade payments through the **already-working** `razorpay-create-order` Payment Links API, just like power-ups. The proration calculation stays in the backend, but the payment is handled via full-page redirect instead of a modal.

## Changes

### 1. Update `razorpay-upgrade-subscription/index.ts`

Instead of creating an Orders API order and returning SDK parameters, this function will:
- Keep the proration calculation logic (it's correct)
- Create a **Payment Link** (like `razorpay-create-order` does) instead of an Order
- Store the order in `payment_orders` with `order_type: "upgrade"`
- Return `{ success: true, paymentUrl: shortUrl }` for redirect
- Keep the `direct_upgrade` flow for amounts under $1

### 2. Update `useRazorpaySubscription.ts` -- `upgradeSubscription` function

Remove all Razorpay SDK modal code. Replace with a simple redirect:
- Call `razorpay-upgrade-subscription`
- If `flowType === "direct_upgrade"` -- show success toast (no payment needed)
- If `flowType === "proration_order"` -- redirect to `data.paymentUrl` (Payment Link URL)
- Remove `RazorpayOptions`, `RazorpayResponse`, `RazorpayInstance` interfaces (no longer needed)
- Remove `window.Razorpay` dependency

### 3. Update `razorpay-verify-payment/index.ts`

Ensure upgrade orders are handled during verification:
- When `order_type === "upgrade"`, after successful payment verification, update the subscription plan in the database (using `process_upgrade_success` RPC or inline SQL)
- The `PaymentSuccess.tsx` page already handles the callback correctly

## Technical Details

### Proration Payment Link (in upgrade edge function)
```
POST https://api.razorpay.com/v1/payment_links
{
  amount: prorationAmount,
  currency: "USD",
  reference_id: orderId,
  callback_url: "https://solarizer-app.lovable.app/payment-success",
  callback_method: "get",
  description: "Upgrade to Business Plan",
  notes: { user_id, order_type: "upgrade", from_plan, to_plan }
}
```

### Frontend Flow After Fix
1. User clicks "Upgrade" -> confirmation modal shows proration amount
2. User confirms -> calls `razorpay-upgrade-subscription`
3. If < $1: instant upgrade, toast shown
4. If >= $1: `window.location.href = paymentUrl` (full-page redirect to Razorpay)
5. After payment: Razorpay redirects to `/payment-success?razorpay_payment_id=...`
6. `PaymentSuccess.tsx` calls `razorpay-verify-payment` which processes the upgrade

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/razorpay-upgrade-subscription/index.ts` | Replace Orders API with Payment Links API |
| `src/hooks/useRazorpaySubscription.ts` | Remove SDK modal, use redirect |
| `supabase/functions/razorpay-verify-payment/index.ts` | Handle `upgrade` order type on verification |

