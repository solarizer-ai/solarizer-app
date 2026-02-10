

# Remove Default Plan on Signup -- Require Subscription Before Use

## Summary

New users will sign up with **no plan** and **no credits**. They must subscribe to a plan (Launch, Pro, or Business) before they can run scans or access plan-gated features. The dashboard and UI will guide unsubscribed users toward picking a plan.

## Changes

### 1. Database: `handle_new_user()` function

Remove the subscription and credit initialization from the trigger. After the change, the function will only create the profile and assign the `user` role -- no `subscriptions` row and no `nloc_credits` row.

### 2. Database: `initialize_user_credits()` trigger

This trigger auto-creates `nloc_credits` rows on user creation. It needs to be removed or disabled since credits should only be provisioned when a subscription is purchased.

### 3. Database: `purchase_subscription` RPC

Currently this function does `UPDATE subscriptions ... WHERE user_id`. Since new users won't have a subscription row, update it to `INSERT ... ON CONFLICT` (upsert) for both the `subscriptions` and `nloc_credits` tables so the first subscription purchase creates the rows.

### 4. Frontend: Handle `null` subscription state

Currently the code defaults to `'starter'` when no subscription exists (`subscription?.plan || 'starter'`). Multiple files need updating:

| File | Change |
|------|--------|
| `src/hooks/useFeatureAccess.ts` | Treat `null` subscription as "no plan" instead of defaulting to `starter`. All features locked. |
| `src/components/CreditBalance.tsx` | Show "No Plan" or "Subscribe" state when subscription is `null` |
| `src/pages/Index.tsx` | Block "Run Analysis" for users with no subscription; show prompt to subscribe. Also hide low-credit prompt when no subscription. |
| `src/components/AuditWizard.tsx` | Guard scan submission -- if no subscription, redirect to pricing. |
| `src/pages/Pricing.tsx` | Already handles `null` subscription with "Subscribe" button -- no change needed. |
| `src/pages/Settings.tsx` | Show "No active plan" state in the Plans section when subscription is `null`. |
| `src/components/settings/SubscriptionPlanSelector.tsx` | Handle `null` current plan -- show all plans as "Subscribe" instead of upgrade/downgrade. |
| `src/lib/nlocCalculator.ts` | No structural change, but `PLAN_LIMITS.starter.initialCredits` should be updated to `0` since starter no longer auto-provisions credits on signup (credits come from subscription purchase). |

### 5. Edge functions: Razorpay webhook / verify-payment

The `process_payment_success` DB function already handles subscription updates. It needs to handle the case where no `subscriptions` row exists yet (first-time purchase). Same upsert pattern as the `purchase_subscription` RPC.

### 6. `useSubscription` hook

The hook already returns `null` when no subscription is found (`PGRST116`). No change needed here -- the consuming components just need to stop defaulting `null` to `'starter'`.

## Technical Details

### Updated `handle_new_user()`:
```text
- Creates profile
- Assigns 'user' role
- NO subscription row
- NO nloc_credits row
```

### Updated `purchase_subscription()`:
```text
- INSERT INTO subscriptions ... ON CONFLICT (user_id) DO UPDATE
- INSERT INTO nloc_credits ... ON CONFLICT (user_id) DO UPDATE SET credits_remaining = credits_remaining + credits_to_add
```

### UI State Matrix:

| User State | Dashboard | Run Analysis | Credits Display |
|-----------|-----------|-------------|----------------|
| No subscription | Shows empty state + "Subscribe" CTA | Blocked, redirects to pricing | "No Plan" badge |
| Starter (Launch) | Full dashboard | Allowed (150 nLOC, 1 file limit) | Shows credits |
| Pro | Full dashboard | Allowed (unlimited) | Shows credits |
| Business | Full dashboard | Allowed (unlimited) | Shows credits |

