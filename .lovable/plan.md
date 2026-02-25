

# Credit Settlement, State Transitions, and Safety Fixes

## Overview
7 targeted fixes to Supabase edge functions that close gaps in the audit completion path. These prevent credits from being stuck in "reserved" forever, enable the web dashboard to show final grades/status, and fix race conditions.

## Changes

### A1. cli-audit-complete -- Add credit settlement and audit finalization
**File:** `supabase/functions/cli-audit-complete/index.ts`

After the orchestration row is updated (line 64), add logic to:
1. Fetch the audit record for credit info
2. Calculate grade from findings severities (Critical=F, High=D, Medium=C, Low=B, None=A)
3. Determine final status (`issues` or `secured`)
4. Commit all reserved credits via `cli_commit_credits` RPC
5. Update the `audits` table with final status, grade, lock the record, and zero out reserved credits

This is idempotent -- if `is_locked` is already true, the block is skipped entirely.

### A2. cli-audit-start -- Clean up on orchestration insert failure
**File:** `supabase/functions/cli-audit-start/index.ts` (lines 210-216)

When the orchestration row insert fails, the current code returns an error but leaves reserved credits and an orphaned audit row behind. Add cleanup:
- Release reserved credits via `cli_release_credits` RPC
- Delete the orphaned audit row

### A3. Credit calculation fix -- Already applied
The complexity multiplier fix (L1: 0.8x, L2: 1.0x, L3: 1.2x) was already applied in the previous implementation. No changes needed.

### A4. cli-audit-fail -- Add status guard
**File:** `supabase/functions/cli-audit-fail/index.ts` (line 51)

Add `.in('status', ['queued', 'running'])` to the orchestration UPDATE query to prevent a late-arriving failure notification from overwriting a completed audit.

### A5. cli-audit-progress -- Atomic abort check
**File:** `supabase/functions/cli-audit-progress/index.ts` (lines 45-78)

Replace the separate UPDATE + SELECT with a single UPDATE that uses `.select('aborted')` to atomically return the aborted flag, preventing a cancellation from slipping between the two operations.

### A6. cli-audit-cancel -- Return match info
**File:** `supabase/functions/cli-audit-cancel/index.ts` (lines 50-67)

Add `.select('session_id')` to the UPDATE to check if any rows matched. If no rows were updated (audit already in a terminal state), return 409 instead of a misleading `success: true`.

### A7. No changes needed
The `cli-commit-contract` function remains as-is. Per-contract commits from the proxy are unnecessary now that A1 settles all credits atomically at completion.

---

## Files Modified

| File | Fix |
|------|-----|
| `supabase/functions/cli-audit-complete/index.ts` | A1: Credit settlement, grade calc, audit finalization |
| `supabase/functions/cli-audit-start/index.ts` | A2: Orchestration failure cleanup |
| `supabase/functions/cli-audit-fail/index.ts` | A4: Status guard on UPDATE |
| `supabase/functions/cli-audit-progress/index.ts` | A5: Atomic UPDATE+SELECT |
| `supabase/functions/cli-audit-cancel/index.ts` | A6: 409 when already terminal |

No new tables, columns, RLS policies, migrations, or environment variables needed.

