
# Trial Tier Mapping & Expiry Guards

## Trial → Proxy Tier Mapping

`web-audit-start` maps internal `plan = 'trial'` to `tier = 'business'` (Inferno-level) before sending to the Cloud Run proxy, which only accepts `starter | pro | business`.

## Trial Expiry Enforcement (3 layers)

1. **`web-audit-start`** — checks `current_period_end < now()` → returns 403 before any audit logic runs.
2. **`deduct_credits` RPC** — rejects if `plan = 'trial'` AND `current_period_end < now()`.
3. **`expire_overdue_subscriptions` cron** — transitions expired trials to `status = 'expired'`, preventing future access entirely.

No additional expiry logic is needed.
