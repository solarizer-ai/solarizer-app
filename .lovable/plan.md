

# Remote Audit Orchestration Implementation Plan

## Overview
Move audit orchestration from CLI to Cloud Run proxy, using Supabase as the sole communication layer between CLI and proxy. This adds 1 new table, 1 shared utility, 7 new edge functions, and 1 edge function update.

## Step 1: Database Migration

Create the `audit_orchestration` table with:
- `session_id` (TEXT PRIMARY KEY) -- matches `audits.id`
- `user_id`, `status`, `phase`, `progress` (JSONB), `request_payload` (JSONB)
- `findings` (JSONB), `report_markdown` (TEXT), `findings_count` (INT)
- `error` (TEXT), `aborted` (BOOLEAN), `started_at`, `updated_at`
- Index on `(user_id, status)` for active audit lookups
- RLS enabled with no policies (all access via service role edge functions)
- Status constrained to: `queued`, `running`, `completed`, `failed`, `cancelled`

Note: Will use a validation trigger instead of a CHECK constraint for the status field, per project guidelines.

## Step 2: Shared Utility

Create `supabase/functions/_shared/verifyServiceSecret.ts`:
- Reads `x-service-secret` header and compares against `SESSION_SECRET` env var
- Uses `crypto.subtle.timingSafeEqual` for constant-time comparison
- Handles length mismatch with dummy comparison to prevent timing leaks

## Step 3: CLI-Facing Edge Functions (4 functions)

### cli-audit-start
- Auth: `x-api-key` via `validateApiKey()`
- Validates scope files, checks for existing running audit (prevents duplicates)
- Calculates estimated cost (scope nLOC + 15% context nLOC)
- Reserves credits via `cli_reserve_credits` RPC
- Creates `audits` row (for billing) and `audit_orchestration` row (for status)
- Fires request to Cloud Run proxy `/audit/run` (non-blocking, failure tolerant)
- Returns `{ sessionId }`

### cli-audit-status
- Auth: `x-api-key`
- Takes `{ sessionId }`, returns `{ status, phase, progress, findings_count, error }`
- Scoped to authenticated user's audits only

### cli-audit-report
- Auth: `x-api-key`
- Takes `{ sessionId }`, returns `{ findings, report_markdown, findings_count }`
- Only returns data when status is `completed`

### cli-audit-cancel
- Auth: `x-api-key`
- Sets `aborted=true`, `status='cancelled'` on orchestration row
- Releases reserved credits via `cli_release_credits` RPC
- Marks audit as failed/locked in `audits` table

## Step 4: Proxy-Facing Edge Functions (3 functions)

### cli-audit-progress
- Auth: `x-service-secret`
- Updates `phase`, `progress` JSONB, `findings_count`, sets status to `running`
- Returns `{ aborted }` flag so proxy can stop if user cancelled

### cli-audit-complete
- Auth: `x-service-secret`
- Saves `findings` array, `report_markdown`, sets status to `completed`

### cli-audit-fail
- Auth: `x-service-secret`
- Sets status to `failed`, saves error message
- Releases reserved credits and locks the audit

## Step 5: Update cli-auth

Add a query to `audit_orchestration` for `queued`/`running` audits. Include an `active_audit` field (singular) in the response that prefers orchestrated audits over legacy active audits. The existing `active_audits` array remains for backward compatibility.

## Step 6: Config Updates

Add all 7 new functions to `supabase/config.toml` with `verify_jwt = false`:

```text
cli-audit-start, cli-audit-status, cli-audit-report, cli-audit-cancel
cli-audit-progress, cli-audit-complete, cli-audit-fail
```

## Step 7: Verification

Test endpoints with curl after deployment to confirm:
- CLI-facing functions reject missing/invalid API keys (401)
- Proxy-facing functions reject missing service secret (401)
- `cli-auth` response includes the new `active_audit` field

---

## Technical Notes

- No new secrets needed -- `SESSION_SECRET` and `CLOUD_RUN_PROXY_URL` already exist
- CLI-facing CORS allows `x-api-key`; proxy-facing CORS allows `x-service-secret`
- Proxy-facing functions reject OPTIONS preflight (server-to-server only)
- All edge function code follows the existing patterns in the codebase (same error handling, logging, response structure)

## Files Created/Modified

| File | Action |
|------|--------|
| Migration SQL | Create `audit_orchestration` table + index |
| `supabase/functions/_shared/verifyServiceSecret.ts` | Create |
| `supabase/functions/cli-audit-start/index.ts` | Create |
| `supabase/functions/cli-audit-status/index.ts` | Create |
| `supabase/functions/cli-audit-report/index.ts` | Create |
| `supabase/functions/cli-audit-cancel/index.ts` | Create |
| `supabase/functions/cli-audit-progress/index.ts` | Create |
| `supabase/functions/cli-audit-complete/index.ts` | Create |
| `supabase/functions/cli-audit-fail/index.ts` | Create |
| `supabase/functions/cli-auth/index.ts` | Modify |
| `supabase/config.toml` | Modify (add 7 function entries) |

