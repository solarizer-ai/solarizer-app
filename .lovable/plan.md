

# Findings Sync and Per-Contract Credit Commit

This plan adds `verification_status` tracking to findings, enables the CLI to enrich duplicate findings, introduces batch updates for post-validation status changes, adds per-contract credit commits, and filters false positives from the web UI.

---

## A1. Migration: Add `verification_status` Column

Create a new enum type and add the column to the `findings` table.

```sql
CREATE TYPE public.finding_verification_status
  AS ENUM ('unverified', 'verified', 'downgraded', 'false_positive');

ALTER TABLE public.findings
  ADD COLUMN verification_status public.finding_verification_status
  NOT NULL DEFAULT 'unverified';
```

---

## A2. Update `save-finding` Edge Function

**File:** `supabase/functions/save-finding/index.ts`

1. Add `verification_status` to the `FindingInput` interface (optional, defaults to `'unverified'`).
2. Validate `verification_status` against the four allowed values if provided.
3. Include `verification_status` in the INSERT statement.
4. Change duplicate handling: instead of skipping, UPDATE the existing finding with any non-null fields from the new request (title match still uses `title + severity` for lookup, but now enriches with `line_start`, `line_end`, `code_snippet`, `remediation`, `location`, `verification_status`, `description`).
5. Return `was_duplicate` and `was_updated` flags in the response.

---

## A3. New Edge Function: `update-findings-batch`

**File:** `supabase/functions/update-findings-batch/index.ts`

- Server-to-server only (no CORS, reject OPTIONS with 403)
- Authenticates via `x-callback-token` using the shared `verifyCallback` helper
- Accepts `{ audit_id, updates: [{ finding_id, verification_status?, severity?, line_start?, line_end?, code_snippet? }] }`
- Checks audit is not locked
- For each update entry, applies only non-null/non-undefined fields to the matching finding row (using service role client)
- Returns `{ success: true, updated_count: number }`

**Config:** Add to `supabase/config.toml`:
```toml
[functions.update-findings-batch]
verify_jwt = false
```

---

## A4. New Edge Function: `cli-commit-contract`

**File:** `supabase/functions/cli-commit-contract/index.ts`

- Uses same session JWT verification as `cli-session-end` (copy `verifySessionJWT` helper)
- Accepts `{ session_id, contract_path, credit_amount }`
- Validates `session_id` matches JWT's `sessionId`
- Fetches audit record, confirms ownership via JWT `userId`, confirms audit is not locked
- Clamps `credit_amount` to `credits_reserved` (never commit more than reserved)
- Calls `cli_commit_credits(userId, clampedAmount, auditId, description)` RPC
- Updates audit: `SET credits_reserved = credits_reserved - clampedAmount, contracts_completed = contracts_completed + 1, current_contract = contract_path, last_heartbeat = now()`
- Returns `{ success: true, committed, remaining_reserved }`

**Config:** Add to `supabase/config.toml`:
```toml
[functions.cli-commit-contract]
verify_jwt = false
```

---

## A5. Web App: Filter `false_positive` Findings

**File:** `src/hooks/useAudits.ts`

- Add `verification_status` field to the `Finding` interface (type: `'unverified' | 'verified' | 'downgraded' | 'false_positive'`)
- In `useFindings`, add `.neq('verification_status', 'false_positive')` to the Supabase query so false positives are excluded by default

**File:** `src/pages/Report.tsx`

- No changes needed; filtering at the query level means the UI automatically hides false positives

---

## A6. Update `complete-audit` Grade Calculation

**File:** `supabase/functions/complete-audit/index.ts`

- When fetching findings for grade calculation, exclude `false_positive` findings: add `.neq('verification_status', 'false_positive')` to the findings query so false positives don't affect the security grade.

---

## Summary of Files Changed

| File | Change |
|------|--------|
| Migration SQL | New enum type + column on `findings` |
| `supabase/functions/save-finding/index.ts` | Add `verification_status`, change duplicate logic to UPDATE |
| `supabase/functions/update-findings-batch/index.ts` | New edge function |
| `supabase/functions/cli-commit-contract/index.ts` | New edge function |
| `supabase/config.toml` | Add two new function entries |
| `src/hooks/useAudits.ts` | Add `verification_status` to `Finding`, filter query |
| `supabase/functions/complete-audit/index.ts` | Exclude false positives from grade calc |

