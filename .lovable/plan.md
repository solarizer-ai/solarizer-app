

# Remove All Cashfree References

## Summary

Cashfree is fully replaced by Razorpay. There is zero Cashfree data in the database, so all removals are safe. This plan covers edge functions, frontend hooks, database objects, config entries, and secrets.

## 1. Delete Cashfree Edge Functions

Delete these 7 edge function directories and their deployed functions:

- `supabase/functions/cashfree-cancel-subscription/`
- `supabase/functions/cashfree-create-order/`
- `supabase/functions/cashfree-create-subscription/`
- `supabase/functions/cashfree-reactivate-subscription/`
- `supabase/functions/cashfree-upgrade-subscription/`
- `supabase/functions/cashfree-verify-payment/`
- `supabase/functions/cashfree-webhook/`

## 2. Delete Frontend Cashfree Hooks

Delete these 2 files (neither is imported anywhere):

- `src/hooks/useCashfreeCheckout.ts`
- `src/hooks/useCashfreeSubscription.ts`

## 3. Clean Frontend References

### `src/hooks/useSubscription.ts`
- Remove `cf_subscription_id` and `cf_plan_id` from the `Subscription` interface (lines 17-19)
- Remove the comment "New fields for Cashfree Subscriptions"

### `src/pages/SubscriptionSuccess.tsx`
- Line 52-54: Replace the Cashfree/Razorpay hybrid check with a Razorpay-only check:
  ```typescript
  const hasActiveSubscription = subscription?.status === "active" &&
    (subscription as unknown as { rz_subscription_id?: string })?.rz_subscription_id;
  ```

## 4. Remove config.toml Entries

Remove these 3 blocks from `supabase/config.toml`:

```text
[functions.cashfree-create-order]
verify_jwt = false

[functions.cashfree-webhook]
verify_jwt = false

[functions.cashfree-verify-payment]
verify_jwt = false
```

## 5. Database Migration

Drop Cashfree-specific database objects and columns (all confirmed empty):

```sql
-- Drop the cf_subscription_events table (0 rows)
DROP TABLE IF EXISTS public.cf_subscription_events;

-- Drop Cashfree-only DB functions
DROP FUNCTION IF EXISTS public.activate_subscription;
DROP FUNCTION IF EXISTS public.process_subscription_renewal;
DROP FUNCTION IF EXISTS public.handle_subscription_payment_failed;
DROP FUNCTION IF EXISTS public.process_upgrade_success;

-- Remove Cashfree columns from subscriptions table
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cf_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cf_plan_id;
```

Note: `process_payment_success` and `cancel_subscription` reference `cf_` fields in their return values but are still used by Razorpay flow -- these will be cleaned up by removing the now-dropped columns (the references will simply return null going forward, which is harmless). If you'd like them fully cleaned, that can be a follow-up.

## 6. Remove Cashfree Secrets

Request removal of these 3 secrets (no longer used by any function):

- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_ENVIRONMENT`

## What Does NOT Change

- All Razorpay edge functions remain untouched
- All CLI edge functions remain untouched
- `_shared/apiKeyAuth.ts` and `_shared/encryption.ts` remain untouched
- `index.html` already only loads the Razorpay SDK -- no changes needed
- `src/integrations/supabase/types.ts` is auto-generated and will update automatically after the migration

