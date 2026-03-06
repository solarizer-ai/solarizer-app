# Lovable Backend Spec: Free Trial + Credit System Changes

## 1. Schema Changes

```sql
-- Add 'trial' to plan constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('starter', 'pro', 'business', 'trial'));

-- Add token_type to access_tokens
ALTER TABLE access_tokens ADD COLUMN token_type text NOT NULL DEFAULT 'subscription'
  CHECK (token_type IN ('subscription', 'trial'));

-- Track trial activation (prevent re-trials)
ALTER TABLE profiles ADD COLUMN trial_activated_at timestamptz DEFAULT NULL;
```

## 2. New RPC: `activate_trial(p_code text)`

Create a new RPC function that:

1. Validates token: must be active, not expired, uses remaining, `token_type = 'trial'`
2. Rejects if user has an active subscription (any plan) or `trial_activated_at IS NOT NULL`
3. Upserts `subscriptions`: `plan = 'trial'`, `status = 'active'`, `current_period_end = now() + interval '14 days'`
4. Upserts `nloc_credits`: `credits_remaining = 300`
5. Records redemption in `token_redemptions`, increments `uses` on the token
6. Sets `profiles.trial_activated_at = now()`

Returns `{ success: true }` or `{ success: false, error: '...' }`.

## 3. Modify `handle_new_user()` Trigger

Stop auto-provisioning starter plan + credits for new signups:
- Do NOT create a `subscriptions` row (frontend handles null as "No Plan")
- Create `nloc_credits` row with `credits_remaining = 0`

## 4. Guard Existing RPCs

### `deduct_credits`
Add check: reject if `plan = 'trial'` AND `current_period_end < now()` (expired trial).

### `purchase_power_up`
Add check: reject if `plan = 'trial'` (trial users cannot buy credits).

### `validate_access_token`
Return `token_type` in the response object alongside existing fields.

### `razorpay-create-order` (Edge Function)
Update credit rate calculation to flat 100 cents ($1.00) per credit regardless of plan.

## 5. Edge Function: `cli-auth`

Map `plan = 'trial'` to Inferno-tier permissions. Check trial expiry server-side (reject if `current_period_end < now()`).

## 6. Credit Rate Change

All credit pricing is now flat $1.00 (100 cents) per credit across all plans. Update any backend logic that uses per-plan credit rates:
- Spark: was 400 cents → now 100 cents
- Blaze: was 370 cents → now 100 cents
- Inferno: was 350 cents → now 100 cents

## 7. Included Credits per Plan

Monthly credit grants now scale with plan:
- Spark (starter): 50 credits/month
- Blaze (pro): 100 credits/month
- Inferno (business): 200 credits/month
- Trial: 300 credits (one-time)

Update `process_payment_success` or subscription renewal logic to grant the correct amount.
