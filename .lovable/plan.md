

# Fix: Trial Tier Mapping in web-audit-start + Update Plan

## Root Cause
The `web-audit-start` edge function passes `subscription.plan` (value `'trial'`) directly as `tier` to the Cloud Run proxy (line 373). The proxy only recognizes `starter`, `pro`, `business` — so it rejects with `400: Invalid tier: trial`.

The existing expiry check (lines 259-268) already blocks expired trials before reaching the proxy call, so trial access is correctly revoked on expiry.

## Changes

### 1. `supabase/functions/web-audit-start/index.ts`

**A. Add tier mapping** (after line 270):
```typescript
const TIER_MAP: Record<string, string> = {
  starter: 'starter', pro: 'pro', business: 'business',
  trial: 'business',  // Trial gets Inferno-tier access
};
const proxyTier = TIER_MAP[tier] ?? 'starter';
```

**B. Add `trial` to nLOC limits** (line 273):
```typescript
const PLAN_NLOC_LIMITS: Record<string, number> = {
  starter: 500, pro: 3000, business: 9999, trial: 9999,
};
```

**C. Use `proxyTier` in proxy payload** (line 373): replace `tier` with `proxyTier` in the body sent to `/audit/run`.

### 2. `.lovable/plan.md`

Replace the stale launch-banner plan with current state documentation covering the trial tier mapping fix and confirming that trial expiry is already enforced:
- `web-audit-start` checks `current_period_end < now()` and returns 403 before any audit logic runs
- `deduct_credits` RPC rejects expired trials
- `expire_overdue_subscriptions` cron job transitions expired trials to `status = 'expired'`
- No additional expiry logic needed — three layers already guard this

