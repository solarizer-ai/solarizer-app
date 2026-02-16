

# Fix: CLI Session Start Failing Due to NOT NULL Constraint on `contract_code`

## Problem

The `cli-session-start` edge function fails when creating an audit record because the `contract_code` column on the `audits` table has a `NOT NULL` constraint. In the CLI flow, the source code is not available at session start -- it is sent later during the `run-audit` call. The insert omits `contract_code`, triggering the constraint violation.

## Solution

Make the `contract_code` column nullable via a database migration. This is safe because:

- The CLI flow sends code later via `run-audit`
- The web flow already sets `contract_code` at creation time, so existing behavior is unaffected
- No application code reads `contract_code` as a required field at audit creation time

## Changes

### 1. Database Migration

```sql
ALTER TABLE public.audits ALTER COLUMN contract_code DROP NOT NULL;
```

### 2. No Edge Function Changes Needed

The `cli-session-start` function's insert statement is correct -- it simply doesn't have a `contract_code` value to provide at that stage, which is expected for the CLI flow.

## Impact

- Web flow: No change (still provides `contract_code` on insert)
- CLI flow: Audit creation succeeds; `contract_code` remains NULL until populated later if needed
- Existing data: Unaffected (all existing rows already have values)

