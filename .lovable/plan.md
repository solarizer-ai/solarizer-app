

# Fix: Renew Expired Subscription for pro@test.com

## Root Cause

The subscription for `pro@test.com` (user `0b94b478-...`) has:
- **plan**: `business` (Inferno)
- **status**: `expired` (set by the daily `expire_overdue_subscriptions` cron)
- **current_period_end**: `2026-02-22` -- 5 days ago
- **credits_remaining**: ~4.9M

The `NewAuditPage` gate checks `subscription?.status === 'active' && !isExpired`. Since the status is `expired`, the gate blocks audit creation despite having plenty of credits.

## Fix Options

### Option A -- Renew the subscription in the database (quick fix)

Update the subscription row to extend the period by 1 month from now and set status back to `active`. This simulates a renewal.

**Database update:**
```sql
UPDATE subscriptions
SET status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 month',
    updated_at = now()
WHERE user_id = '0b94b478-7d25-490b-a4b3-0632f72a6cc4';
```

### Option B -- Also improve the frontend gating (recommended addition)

In addition to the data fix, add a loading guard to `NewAuditPage.tsx` so the "Subscription Required" screen never flashes while data is loading. This was already identified as a needed improvement.

- Destructure `isLoading` from `useSubscription()` and `useCredits()`
- Show a skeleton/loading card while either is loading
- Only evaluate the gate logic once both queries have resolved

## Recommendation

Both options should be applied:
1. **Data fix** (Option A) to unblock the user immediately
2. **Code fix** (Option B) to prevent the loading flash issue for all users

No schema or RLS changes needed -- this is a data update + minor frontend guard.

