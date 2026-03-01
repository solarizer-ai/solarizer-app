

# Create `audit-session-ops` Edge Function

## Overview
Create a new service-to-service edge function that allows the Cloud Run proxy to verify and claim audit sessions in `audit_orchestration`, bypassing RLS by using the service role key.

## Changes

### 1. Create `supabase/functions/audit-session-ops/index.ts`
- Validate `x-service-secret` via `verifyServiceSecret()`
- Parse JSON body for `sessionId` and `action` ("verify" or "claim")
- **verify**: SELECT from `audit_orchestration` by `session_id`, return status and tier from `request_payload`
- **claim**: UPDATE `audit_orchestration` SET `status = 'running'` WHERE `session_id = ? AND status = 'queued'`; return `claimed: true/false`
- No CORS headers (server-to-server); OPTIONS returns 403
- Uses `createServiceClient()` from shared helper

### 2. Update `supabase/config.toml`
- Add `[functions.audit-session-ops]` with `verify_jwt = false`

### 3. Deploy
- Deploy the new edge function

No database changes or new secrets required -- uses existing `SESSION_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
