

# Fix: API Key Generation "Worker is not defined" Error

## Problem

The `cli-generate-api-key` edge function crashes with **"Worker is not defined"** because the `bcrypt` library (`deno.land/x/bcrypt@v0.4.1`) uses Web Workers for its async `hash()` function. Supabase Edge Functions (Deno Deploy) do not support Web Workers.

## Solution

Replace the async `bcrypt.hash()` call with `bcrypt.hashSync()` in the generate function, and `bcrypt.compare()` with `bcrypt.compareSync()` in the auth helper. The sync variants avoid the Worker dependency entirely.

## Changes

### 1. `supabase/functions/cli-generate-api-key/index.ts` (line 92)

Replace:
```typescript
const keyHash = await bcrypt.hash(fullKey, 10);
```
With:
```typescript
const keyHash = bcrypt.hashSync(fullKey);
```

### 2. `supabase/functions/_shared/apiKeyAuth.ts` (line 41)

Replace:
```typescript
const matches = await bcrypt.compare(apiKey, key.key_hash);
```
With:
```typescript
const matches = bcrypt.compareSync(apiKey, key.key_hash);
```

## No Other Changes Needed

- The `cli-reveal-api-key` function does not use bcrypt, so it is unaffected.
- The encryption/decryption logic uses Web Crypto API natively and works fine.
- No database or frontend changes required.
