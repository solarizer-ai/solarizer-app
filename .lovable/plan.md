
# Pricing Update — Single Inferno Plan ($99/month)

## Completed Changes

### 1. Build Error Fix
- `cli-audit-start/index.ts`: Added missing `nloc_credits` query before credit balance check (was causing `ReferenceError: credits is not defined`).

### 2. Edge Function Pricing
- `razorpay-create-order/index.ts`: `PLAN_PRICES` → `{ business: 9900 }` ($99). `POWER_UP_RATE_CENTS` → `10` ($0.10/credit flat).
- `razorpay-upgrade-subscription/index.ts`: `PLAN_PRICES` → `{ business: 9900 }`.

### 3. DB: `process_payment_success`
- All subscription plans now grant **500 credits** on payment (was: starter 50, pro 100, business 200).
- Removed annual billing branch (monthly only).

### 4. Frontend
- Already updated: Pricing page shows single Inferno plan at $99/month with 500 credits. `PurchaseCreditsModal` uses `PRICE_PER_CREDIT_CENTS = 10`.

## Trial Tier Mapping (unchanged)
- `web-audit-start` maps `plan = 'trial'` → `tier = 'business'` for proxy.
- Trial expiry enforced in `web-audit-start`, `deduct_credits` RPC, and `expire_overdue_subscriptions` cron.
