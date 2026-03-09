

# Fix: Orphaned audit_orchestration rows blocking new audits

## Problem
When you delete an audit from the dashboard, only the `audits` row is removed. The corresponding `audit_orchestration` row (with status `running`) remains because there's no cascade delete relationship between the two tables. The conflict check at line 241 of `web-audit-start-rnd` queries `audit_orchestration` for active sessions, finds the orphan, and returns a 409.

## Solution (two parts)

### 1. Immediate fix: Clean up the stale orchestration row
Run a data operation to delete (or mark as `failed`) the orphaned orchestration row for session `b88e63a1-9d1f-465b-8b1c-68e9b3eb52e5`. This unblocks you immediately.

### 2. Permanent fix: Cascade-delete orchestration when audit is deleted
Both `web-audit-start` and `web-audit-start-rnd` edge functions already clean up orchestration rows in their error paths. But when a user deletes an audit from the dashboard (via the `audits` table RLS DELETE policy), nothing cleans up `audit_orchestration`.

**Option A — DB trigger (recommended):** Create a trigger on `audits` `BEFORE DELETE` that automatically deletes the matching `audit_orchestration` row.

```sql
CREATE OR REPLACE FUNCTION delete_orphan_orchestration()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM audit_orchestration WHERE session_id = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_orchestration
  BEFORE DELETE ON audits
  FOR EACH ROW
  EXECUTE FUNCTION delete_orphan_orchestration();
```

This ensures any audit deletion (dashboard, admin, auto-settle) also removes the orchestration row, preventing future 409 conflicts.

## Changes
| What | Action |
|------|--------|
| Stale orchestration row `b88e63a1...` | DELETE via data operation |
| `delete_orphan_orchestration()` function + trigger | DB migration |
| No edge function or frontend changes needed | — |

