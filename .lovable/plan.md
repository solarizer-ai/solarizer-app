
# Post-Simplification Edge Function Fixes — 4 Changes

## C1. Fix logging bug in `cli-audit-complete`
**File:** `supabase/functions/cli-audit-complete/index.ts`, line 134

Change `audit.credits_reserved` to `audit.credits_deducted` in the log statement. The SELECT on line 87 returns `credits_deducted`, so `credits_reserved` is `undefined`.

## C2. Clean up dead `credits_reserved` in `cli-session-progress`
**File:** `supabase/functions/cli-session-progress/index.ts`

Three changes:
1. **Line 120:** Remove `credits_reserved` from the SELECT query
2. **Lines 132-133:** Simplify resumable check to only use `credits_deducted`
3. **Lines 138-139:** Remove `credits_reserved` from JSON response

## C3. Add error logging on refund in `cli-session-start`
**File:** `supabase/functions/cli-session-start/index.ts`, lines 184-189

Capture the refund RPC result and log CRITICAL error if it fails, enabling manual reconciliation.

## C4. Add error logging on refunds in `cli-audit-start`
**File:** `supabase/functions/cli-audit-start/index.ts`

Same pattern at two locations:
1. **Lines 207-213:** Audit creation failure refund
2. **Lines 252-258:** Orchestration setup failure refund

Both get error capture with CRITICAL-level logging.

## Files Modified

| File | Fix |
|------|-----|
| `cli-audit-complete/index.ts` | Fix `credits_reserved` -> `credits_deducted` in log |
| `cli-session-progress/index.ts` | Remove 3 dead `credits_reserved` references |
| `cli-session-start/index.ts` | Add error logging on refund call |
| `cli-audit-start/index.ts` | Add error logging on 2 refund calls |

All 4 functions will be redeployed.
