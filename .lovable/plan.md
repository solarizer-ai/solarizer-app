

# Hotfix: Reserve-Commit Deployment Blockers

Four fixes across one migration and one edge function edit.

---

## Part 1: New SQL Migration

### Fix 1 -- CRITICAL: Expand `credit_txns` CHECK constraint

The existing constraint only allows `subscription_grant`, `purchase`, `deduction`, `refund`. The three new RPCs insert `reservation`, `commit`, `release` -- all rejected at runtime.

```sql
ALTER TABLE public.credit_txns
  DROP CONSTRAINT credit_txns_type_check;

ALTER TABLE public.credit_txns
  ADD CONSTRAINT credit_txns_type_check
  CHECK (type IN (
    'subscription_grant', 'purchase', 'deduction', 'refund',
    'reservation', 'commit', 'release'
  ));
```

### Fix 2 -- CRITICAL: Handle NULL heartbeat in `auto_settle_stale_sessions`

`NULL < timestamp` evaluates to `NULL` in SQL, so audits that never sent a heartbeat are never settled. Replace the function with `CREATE OR REPLACE`, changing only the WHERE clause:

```sql
AND (last_heartbeat < now() - interval '12 hours'
     OR (last_heartbeat IS NULL
         AND created_at < now() - interval '12 hours'))
```

Rest of the function body is unchanged.

### Fix 3 (column) -- HIGH: Add `current_phase` column to `audits`

```sql
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS current_phase TEXT;
```

### Fix 4 (column) -- HIGH: Add `findings_count` column to `audits`

```sql
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS findings_count INTEGER DEFAULT 0;
```

---

## Part 2: Edge Function Edit

**File:** `supabase/functions/cli-session-progress/index.ts`

### Fix 3 -- Write `current_phase` to the correct column (lines 160-162)

Replace `updateData.current_contract = body.current_phase` with `updateData.current_phase = body.current_phase`.

### Fix 4 -- Persist `findings_count` (insert after current_phase block, before line 164)

Add:
```typescript
if (body.findings_count !== undefined) {
  updateData.findings_count = body.findings_count;
}
```

No changes to the `HeartbeatRequest` interface -- it already declares both fields.

