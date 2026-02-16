
# Phase 2: CLI Authentication Layer

## Summary

Create the CLI authentication infrastructure: a shared API key validation module and two new edge functions. All code is provided in the uploaded spec files and will be used as-is.

## Files to Create

### 1. `supabase/functions/_shared/apiKeyAuth.ts`
Shared helper for API key validation using bcrypt. Imported by `cli-auth` and future CLI edge functions. Content from uploaded `spec-apiKeyAuth.ts`.

### 2. `supabase/functions/cli-auth/index.ts`
Edge function that validates a CLI API key (`x-api-key` header) and returns user profile, subscription tier, credit balance, and any active audit. Content from uploaded `spec-cli-auth.ts`.

### 3. `supabase/functions/cli-generate-api-key/index.ts`
Edge function that generates a new API key (called from the website using standard JWT auth). Enforces a 5-key limit per user, bcrypt-hashes the key, stores it, and returns the plaintext key once. Content from uploaded `spec-cli-generate-api-key.ts`.

## Config Changes

Append two entries to `supabase/config.toml`:

```text
[functions.cli-auth]
verify_jwt = false

[functions.cli-generate-api-key]
verify_jwt = false
```

## No Secrets Needed

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are already configured.

## What Does NOT Change

- Existing `_shared/encryption.ts` -- untouched
- All existing edge functions -- untouched
- No frontend changes in this phase
