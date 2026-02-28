

# Fix Failed Kinetiq Audit -- One-Time Data Correction

## Current State
- Audit `7e8c3ed5` is marked as `failed` with `findings_count: 0`, no grade, and `is_locked: true`
- Orchestration record shows `status: failed`, `phase: qa`
- However, 85 findings are persisted in the `findings` table (4 high, 12 medium, 39 low, 19 info, 11 gas)

## Fix

Create a temporary edge function (`admin-fix-audit`) that uses the service role key to update both records:

**audits table:**
- `status`: failed -> issues
- `grade`: null -> D (has high-severity findings)
- `findings_count`: 0 -> 85
- `contracts_completed`: 0 -> 6
- `error_message`: clear to null

**audit_orchestration table:**
- `status`: failed -> completed
- `phase`: qa -> completed
- `findings_count`: 69 -> 85
- `error`: clear to null

## Steps
1. Create `supabase/functions/admin-fix-audit/index.ts` with the two update queries
2. Deploy and invoke it once
3. Delete the edge function after confirming success

No schema changes needed. The `is_locked` flag stays true (correct for terminal state).

