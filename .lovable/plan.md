

# Fix: Upgrade Failed Due to Non-Existent Column

## Root Cause

The `razorpay-upgrade-subscription` edge function queries the `subscriptions` table for a column called `rz_subscription_id`, which does not exist in the database schema. This causes the Supabase query to fail, returning a 400 error with "No subscription found" (since `subError` is truthy).

**Problematic line in `supabase/functions/razorpay-upgrade-subscription/index.ts`:**
```js
.select("plan, current_period_start, current_period_end, rz_subscription_id")
```

The `subscriptions` table has no `rz_subscription_id` column (it was likely from an older Razorpay Subscriptions API integration that has since been replaced with Payment Links).

## Fix

**File:** `supabase/functions/razorpay-upgrade-subscription/index.ts`

Remove `rz_subscription_id` from the `.select()` call since it's not used anywhere else in the function logic:

```js
.select("plan, current_period_start, current_period_end")
```

No database migration needed -- this is purely an edge function code fix.

