
# Access Token Gate for First-Time Subscriptions

Gate new subscriptions behind a valid invite code (access token). Admin can create/manage tokens. Users must enter a valid token before subscribing.

---

## Task 1: Database Migration

Create tables and RPC functions:

- **`access_tokens`** table: `id`, `code` (unique), `description`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_at`
- **`access_token_redemptions`** table: `id`, `token_id`, `user_id`, `redeemed_at` (unique on token_id + user_id)
- RLS: admin-only management for both tables
- **RPCs:**
  - `validate_access_token(p_code)` -- checks validity, returns `{valid, token_id}` or `{valid: false, error}`
  - `redeem_access_token(p_code, p_user_id)` -- SECURITY DEFINER, idempotent redemption
  - `admin_create_access_token`, `admin_toggle_access_token`, `admin_delete_access_token` -- admin CRUD with role checks

---

## Task 2: AccessTokenInput Component

**New file:** `src/components/AccessTokenInput.tsx`

Modeled after `CouponInput.tsx`:
- Text input with KeyRound icon, uppercase, mono font
- "Verify" button calls `validate_access_token` RPC
- Shows green check or red error message
- Reports result (including code string) via `onValidate` callback
- Clear button to reset

---

## Task 3: Update SubscribeConfirmationModal

**Modify:** `src/components/SubscribeConfirmationModal.tsx`

- Import and render `AccessTokenInput` above the coupon input
- Track `validatedTokenCode` state
- Disable Pay button until a valid token is entered
- Update `onConfirm` signature to `(couponCode?, accessTokenCode?) => void`
- Pass `validatedTokenCode` in `handleConfirm`

---

## Task 4: Update useRazorpaySubscription Hook

**Modify:** `src/hooks/useRazorpaySubscription.ts`

- Add `access_token_code?: string` to `CreateSubscriptionParams`
- Pass it in the edge function invocation body

---

## Task 5: Update Pricing.tsx Call Site

**Modify:** `src/pages/Pricing.tsx`

- Update `handleSubscribeConfirm` to accept and forward `accessTokenCode`

---

## Task 6: Update razorpay-create-order Edge Function

**Modify:** `supabase/functions/razorpay-create-order/index.ts`

- Add `access_token_code` to request interface
- For `orderType === "subscription"`: require and validate access token (403 without)
- Store `access_token_code` in payment_orders metadata
- In zero-amount flow: redeem token after fulfillment
- Add token code to Razorpay payment link notes

---

## Task 7: Update razorpay-verify-payment Edge Function

**Modify:** `supabase/functions/razorpay-verify-payment/index.ts`

- After coupon redemption block: check metadata for `access_token_code`
- Call `redeem_access_token` RPC (non-fatal on error)

---

## Task 8: Admin Access Tokens Page

**New file:** `src/pages/dashboard/admin/AdminAccessTokensPage.tsx`

Following the `AdminCouponsPage` pattern:
- Create form: code, description, max uses, expires at
- Tokens table with code, description, used/max, expires, active toggle, delete (with confirmation)
- Redemptions drawer (Sheet) showing user_id + timestamp
- All mutations via admin RPCs

---

## Task 9: Routing and Sidebar

**Modify:** `src/App.tsx`
- Import `AdminAccessTokensPage`
- Add route: `admin/access-tokens`

**Modify:** `src/components/DashboardSidebar.tsx`
- Add "Access Tokens" to `adminNavItems` array with `UserCheck` icon (already imported)

---

## Technical Details

- `POWER_UP_RATES` in `razorpay-create-order` still uses old rates (280/250/220) -- note: the credit rate change was UI-only; these are payment rates per credit for power-ups. The plan specifies NOT updating these as the user only asked to update display rates.
- The `validate_access_token` RPC uses SECURITY DEFINER so it works for authenticated users calling from the frontend (no RLS needed on the table for validation)
- Token redemption is idempotent -- re-redeeming the same token by the same user is a no-op
- Delete with redemptions deactivates instead of deleting to preserve audit trail
- Types file (`src/integrations/supabase/types.ts`) will auto-update after migration; no manual edit needed
