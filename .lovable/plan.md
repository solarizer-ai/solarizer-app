

# Phase 3: CLI Session Lifecycle

## Summary

Create 3 edge functions for CLI audit session management, add config.toml entries, and configure 2 new secrets.

## Files to Create

### 1. `supabase/functions/cli-session-start/index.ts`
Start a CLI audit session: validate API key, enforce 1 concurrent audit, deduct credits via `cli_deduct_credits` RPC, create audit record with `source = 'cli'`, sign a session JWT (HMAC-SHA256, 2hr expiry), and return it with the proxy URL. Auto-refunds on audit creation failure. Content from uploaded `spec-cli-session-start.ts`.

### 2. `supabase/functions/cli-session-end/index.ts`
Finalize a CLI audit session: verify session JWT, then either complete (calculate grade from findings, merge coverage data, lock audit) or fail/cancel (proportional credit refund based on contracts processed). Idempotent on already-locked audits. Content from uploaded `spec-cli-session-end.ts`.

### 3. `supabase/functions/cli-check-credits/index.ts`
Pre-flight check: validate API key, return credit balance, subscription tier, tier discount, and any active session info. Content from uploaded `spec-cli-check-credits.ts`.

## Config Changes

Append to `supabase/config.toml`:

```text
[functions.cli-session-start]
verify_jwt = false

[functions.cli-session-end]
verify_jwt = false

[functions.cli-check-credits]
verify_jwt = false
```

## New Secrets Required

| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | 64-char hex string for signing session JWTs. Generate with `openssl rand -hex 32`. Must match the Cloud Run AI proxy later. |
| `CLOUD_RUN_PROXY_URL` | URL of the AI proxy service. Set placeholder `https://solarizer-ai-proxy-placeholder.run.app` for now. |

## What Does NOT Change

- All existing edge functions remain untouched
- Existing `_shared/apiKeyAuth.ts` and `_shared/encryption.ts` remain untouched
- No frontend changes
- No database schema changes

