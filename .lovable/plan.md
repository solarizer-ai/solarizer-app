

# Add Chat Budget Check + Token Update Edge Functions

## Summary

Create two new edge functions that the Cloud Run proxy calls for chat token budget enforcement. Both authenticate using the existing `SESSION_SECRET` shared secret.

## Changes

### 1. Create `supabase/functions/chat-budget-check/index.ts`

Service-to-service endpoint called by the Cloud Run proxy BEFORE forwarding to Gemini. Validates `x-service-secret` header against `SESSION_SECRET`, queries `chat_sessions` by ID, returns 200 with budget info or 429 if exhausted.

### 2. Create `supabase/functions/chat-token-update/index.ts`

Service-to-service endpoint called AFTER receiving a Gemini response. Validates `x-service-secret`, calls the existing `increment_chat_tokens` RPC to atomically update usage, with a direct UPDATE fallback if RPC fails.

### 3. Update `supabase/config.toml`

Add entries for both new functions with `verify_jwt = false`.

## Technical Details

- Both functions use `x-service-secret` header auth (matched against `SESSION_SECRET` env var)
- No new secrets needed -- `SESSION_SECRET` is already configured
- `chat-budget-check` returns 200/404/429/401
- `chat-token-update` uses `increment_chat_tokens` RPC (created in previous migration), falls back to direct UPDATE
- No existing code is modified

