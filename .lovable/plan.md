

# Safety Hardening Round 2 — 4 Fixes

## Overview
4 targeted fixes to close TOCTOU race conditions in credit operations and improve error handling in progress updates and credit settlement.

## Fix 3: `cli-audit-progress` — Distinguish zero-rows from DB errors (HIGH)
**File:** `supabase/functions/cli-audit-progress/index.ts` (lines 46-84)

Remove `.single()` from the update query so zero-row matches return an empty array instead of throwing PGRST116. This lets us distinguish "audit already terminal" (empty array, fall back to reading aborted flag) from genuine DB errors (updateError is set, return 500).

## Fix 4: `cli-audit-complete` — Check `cli_commit_credits` RPC failure (HIGH)
**File:** `supabase/functions/cli-audit-complete/index.ts` (lines 122-129)

Wrap the `cli_commit_credits` RPC call with error checking. If the RPC fails, roll back `is_locked` to `false` so a retry can re-acquire the lock, and return 500.

## Fix 1: `cli-audit-cancel` — Atomic credit release (CRITICAL)
**File:** `supabase/functions/cli-audit-cancel/index.ts` (lines 77-103)

Replace the read-then-act pattern (SELECT `is_locked` then conditionally release) with:
1. Read `credits_reserved` before the CAS
2. Atomic `UPDATE ... WHERE is_locked = false` to acquire lock and set status to `cancelled`
3. Only release credits if the CAS succeeded and credits were reserved

## Fix 2: `cli-audit-fail` — Atomic credit release (CRITICAL)
**File:** `supabase/functions/cli-audit-fail/index.ts` (lines 72-97)

Same pattern as Fix 1:
1. Read `user_id` and `credits_reserved` before the CAS
2. Atomic `UPDATE ... WHERE is_locked = false` to acquire lock and set status to `failed`
3. Only release credits if the CAS succeeded

## Files Modified

| File | Fix |
|------|-----|
| `supabase/functions/cli-audit-progress/index.ts` | Remove `.single()`, distinguish zero-rows from errors |
| `supabase/functions/cli-audit-complete/index.ts` | Check RPC failure, roll back lock on error |
| `supabase/functions/cli-audit-cancel/index.ts` | Atomic CAS for credit release |
| `supabase/functions/cli-audit-fail/index.ts` | Atomic CAS for credit release |

No new tables, migrations, secrets, or environment variables needed. All 4 functions will be redeployed.
