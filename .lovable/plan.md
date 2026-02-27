

# Fix Subscription Expiration Logic

## Problem
The subscription for the Blaze user shows "Expires Feb 21, 2026" but the subscription is still fully active on Feb 27. There is **no expiration mechanism** anywhere in the codebase -- the `status` column stays `active` forever regardless of `current_period_end`.

## Root Cause
The one-time payment model sets `current_period_end` when a subscription is created, but nothing ever:
1. Checks if that date has passed
2. Marks the subscription as expired
3. Blocks feature access for expired subscriptions

## Solution: Two-Layer Fix

### Layer 1 -- Frontend Guard (immediate UX fix)
Treat a subscription as expired on the client side when `current_period_end` is in the past. This provides instant protection without waiting for a backend job.

**File: `src/hooks/useSubscription.ts`**
- Add a computed `isExpired` boolean: `current_period_end !== null && new Date(current_period_end) < new Date()`
- Export it from the `useSubscription` hook return value

**File: `src/hooks/useFeatureAccess.ts`**
- Import and check `isExpired` -- if expired, treat the user as having no active plan (block gated features)

**File: `src/components/settings/SubscriptionPlanSelector.tsx`**
- When subscription is expired, show an "Expired" banner instead of "Expires [date]"
- Show "Renew Plan" prominently on the current plan row
- Disable upgrade/downgrade buttons (user must renew first)
- Use proper local-date parsing to avoid timezone issues (per the stack overflow hint): parse "YYYY-MM-DD" dates as local, not UTC

**File: `src/pages/dashboard/SubscriptionPage.tsx`**
- Pass the `isExpired` flag to `SubscriptionPlanSelector`

### Layer 2 -- Database Cron (backend enforcement)
Create a database function + pg_cron job that runs daily and sets `status = 'expired'` for subscriptions whose `current_period_end` has passed.

**Migration SQL:**
- Add `'expired'` as a valid status concept (the column is text, so no enum change needed)
- Create function `expire_overdue_subscriptions()` that updates `status = 'expired'` where `current_period_end < now()` and `status = 'active'`
- Schedule via `pg_cron` to run daily at midnight UTC

### Layer 3 -- Fix timezone display
The "Expires Feb 21" display uses `new Date(renewalDate)` which can shift dates due to UTC interpretation. Fix by using `format()` from date-fns which handles this correctly already, but ensure the comparison logic (for showing "Renew Plan" button) uses proper date normalization.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useSubscription.ts` | Add `isExpired` computed field |
| `src/hooks/useFeatureAccess.ts` | Block features when subscription expired |
| `src/components/settings/SubscriptionPlanSelector.tsx` | Show expired state, fix date comparison |
| `src/pages/dashboard/SubscriptionPage.tsx` | Pass isExpired to plan selector |
| New migration SQL | Add `expire_overdue_subscriptions()` cron job |

## Expiration UX

When expired:
- Header shows "Expired on [date]" in red instead of "Expires [date]"
- Current plan row shows "Expired" badge + prominent "Renew Plan" button
- Upgrade/Downgrade buttons are disabled with tooltip "Renew your plan first"
- Feature access (remediation, export, sharing) is blocked as if unsubscribed
