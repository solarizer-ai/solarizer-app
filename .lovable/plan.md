# Pricing Model — Single Inferno Plan

## Subscription
- **Inferno** ($99/month) — the only paid plan
- 500 credits granted monthly
- 9,999 nLOC per audit limit
- Full feature access (insights, sharing, remediation, cross-contract analysis)

## Free Trial
- Activated via invite code at `/activate-trial`
- 14 days duration, 300 one-time credits
- Full Inferno-tier feature access
- One-time per user (tracked via `trial_activated_at`)
- Cannot purchase additional credits while on trial

## Credit Pricing
- Flat $0.10 per credit across all contexts

## Technical Notes
- Internal DB values `starter`, `pro`, `business` all map to display name "Inferno" via `formatPlanName()`
- Trial maps to `tier = 'business'` in edge functions for proxy/audit access
- Trial expiry enforced in `web-audit-start`, `deduct_credits` RPC, and `expire_overdue_subscriptions` cron
- New signups get no plan and 0 credits until they subscribe or activate a trial
- `SubscribeConfirmationModal` PLAN_PRICES need updating to 9900 (currently stale at legacy values)
