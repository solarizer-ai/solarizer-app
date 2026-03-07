

# Pricing Update — Single Inferno Plan at $99/month

## Build Error Fix (Critical)
`cli-audit-start/index.ts` line 247 references `credits` which was never declared. Need to add the `nloc_credits` query before that line (same pattern as `web-audit-start`).

## Backend Changes

### 1. `supabase/functions/razorpay-create-order/index.ts`
- **PLAN_PRICES**: Change to `{ business: 9900 }` ($99). Remove starter/pro entries.
- **POWER_UP_RATES**: Change all values from `100` to `10` (= $0.10/credit).

### 2. `supabase/functions/razorpay-upgrade-subscription/index.ts`
- **PLAN_PRICES**: Update to `{ business: 9900 }`. Remove starter/pro.
- Since all new subs map to `business`, upgrade logic may be unused, but keep consistent.

### 3. `process_payment_success` DB function (migration)
- Change credit grant for `business` from 200 to 500.
- Remove starter/pro cases (or keep them granting 500 for legacy compatibility).
- The CASE becomes: all plans grant 500 credits.

### 4. `add_renewal_credits` — no change needed (caller passes amount).

### 5. `supabase/functions/cli-audit-start/index.ts`
- Add missing credits query: `const { data: credits } = await supabase.from('nloc_credits').select('credits_remaining').eq('user_id', userId).maybeSingle();` before line 247.

### 6. Frontend — already updated
The Pricing page already shows single Inferno plan at $99/month with 500 credits and $0.10/credit rate. `PurchaseCreditsModal` already uses `PRICE_PER_CREDIT_CENTS = 10`. No frontend changes needed.

## Summary of changes
| File | Change |
|------|--------|
| `cli-audit-start/index.ts` | Add credits query (fix build error) |
| `razorpay-create-order/index.ts` | PLAN_PRICES → business: 9900; POWER_UP_RATES → all 10 |
| `razorpay-upgrade-subscription/index.ts` | PLAN_PRICES → business: 9900 |
| `process_payment_success` (DB migration) | All plans grant 500 credits |

