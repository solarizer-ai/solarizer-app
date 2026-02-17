

# Phase 5: Chat Session Management

## Summary

Create the `chat_sessions` table and `chat-session-init` edge function to support 24-hour rolling chat token budgets for the CLI.

## Changes

### 1. Database Migration

Create the `chat_sessions` table with columns for tracking per-user token budgets:

- `id`, `user_id`, `tokens_used`, `token_budget`, `started_at`, `expires_at`, `created_at`, `updated_at`
- Index on `(user_id, expires_at DESC)` for efficient active session lookup
- RLS enabled with a SELECT policy so users can view their own sessions
- All writes happen via service role in edge functions

Token budget tiers (enforced in edge function logic):

| Tier       | Budget (24h) |
|------------|-------------|
| free       | 50,000      |
| starter    | 900,000     |
| pro/business | 2,160,000 |

### 2. New Edge Function: `chat-session-init`

File: `supabase/functions/chat-session-init/index.ts`

- Auth: `x-api-key` header via shared `apiKeyAuth.ts`
- Looks up user's subscription tier to determine token budget
- Finds active (non-expired) session for the user; if found, returns it with remaining tokens
- If no active session, creates a new one with `expires_at = NOW() + 24h`
- Returns: `chat_session_id`, `tokens_used`, `token_budget`, `tokens_remaining`, `expires_at`

### 3. Config Update

Add `[functions.chat-session-init]` with `verify_jwt = false` to `supabase/config.toml`.

## Technical Notes

- No existing edge functions or tables are modified
- The `tokens_used` field will be updated by the `gemini-proxy` function (Phase 6), not this function
- Only one active session per user at a time (enforced by query logic, not DB constraint)
- Session duration is fixed at 24 hours from creation
