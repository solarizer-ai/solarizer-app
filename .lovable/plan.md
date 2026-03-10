

# Unify Plan nLOC Limits to Inferno Tier (9999)

Three edge functions need identical two-line changes each:

### 1. `supabase/functions/web-audit-start/index.ts` (lines 280, 282)
### 2. `supabase/functions/web-audit-start-rnd/index.ts` (lines 280, 282)
### 3. `supabase/functions/cli-audit-start/index.ts` (lines 243, 245)

In each file:
- Change `{ starter: 500, pro: 3000, business: 9999, trial: 9999 }` → `{ starter: 9999, pro: 9999, business: 9999, trial: 9999 }`
- Change fallback `?? 500` → `?? 9999`

No other changes needed. Client-side `nlocCalculator.ts` already updated per the diff.

