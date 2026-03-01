

# Limit Maximum Credits Per Transaction to 1,800

## Change
Update the maximum credits allowed per single purchase transaction from 100,000 to 1,800 across the frontend modal and the backend edge function.

## Files to Modify

### 1. `src/components/PurchasePowerUpModal.tsx`
- Change `MAX_CREDITS` constant from `100000` to `1800`
- The quick-select option of `1000` remains valid (under 1,800)

### 2. `supabase/functions/razorpay-create-order/index.ts`
- Add a server-side validation: if `orderType === "power_up"` and `creditsAmount > 1800`, reject with a 400 error
- This prevents API-level bypass of the limit

No database changes needed.

