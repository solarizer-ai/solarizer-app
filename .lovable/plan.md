

# Add API Key Management to Settings

## Summary

Add an "API Keys" section to the Security tab on the Settings page. Users can generate, reveal, copy, and revoke CLI API keys. Keys are stored encrypted (not just hashed) so they can be revealed and copied at any time.

## What Gets Built

### 1. Database Migration

Add an `key_encrypted` column to the existing `api_keys` table to store the AES-encrypted version of each key:

```sql
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_encrypted text;
```

### 2. Update Edge Function: `supabase/functions/cli-generate-api-key/index.ts`

After generating the key and before inserting, also encrypt it using the shared `encryption.ts` utility with an `ENCRYPTION_KEY` secret. Store the encrypted value in `key_encrypted` alongside the existing bcrypt `key_hash`.

### 3. New Edge Function: `supabase/functions/cli-reveal-api-key/index.ts`

- Accepts `{ keyId: string }` in the body
- Authenticates the user via Bearer token
- Verifies the key belongs to the authenticated user and is not revoked
- Decrypts `key_encrypted` using the shared encryption utility
- Returns the plaintext key

### 4. New Hook: `src/hooks/useApiKeys.ts`

Three React Query operations:
- `useApiKeys()` -- fetches active (non-revoked) keys for the current user from `api_keys` table
- `useGenerateApiKey()` -- mutation calling `cli-generate-api-key` edge function, invalidates query on success
- `useRevokeApiKey()` -- mutation setting `revoked_at = now()` via Supabase client, invalidates query on success

### 5. New Component: `src/components/settings/ApiKeyManager.tsx`

Self-contained component with:
- **Header** with key count indicator (e.g., "2 / 5 active keys")
- **Generate form**: text input for key name + "Generate" button (disabled at 5 keys)
- **Key list**: each row shows name, creation date, last used date, and:
  - **Reveal/Copy button**: calls `cli-reveal-api-key`, then shows the key inline with a copy-to-clipboard button. The key can be copied as many times as needed.
  - **Revoke button**: confirms via alert dialog, then revokes
- **Empty state** when no keys exist

### 6. Update: `src/pages/Settings.tsx`

Import and render `<ApiKeyManager />` inside the Security tab (`TabsContent value="security"`), below any existing content.

## No Secrets Needed

The `ENCRYPTION_KEY` secret already exists in the project (used by `encryption.ts` for GitHub tokens). No new secrets required.

## Technical Details

### Key Reveal Flow

```text
User clicks "Reveal" on a key
  -> Frontend calls cli-reveal-api-key edge function with keyId
  -> Edge function verifies ownership, decrypts key_encrypted
  -> Returns plaintext key
  -> Frontend shows key inline with a Copy button
  -> User can copy as many times as needed
  -> Key stays visible until user navigates away or clicks "Hide"
```

### UI Layout (within Security tab)

```text
+---------------------------------------------+
| API Keys                          2/5 active |
| Generate and manage your CLI API keys        |
|                                              |
| [Key Name Input]         [Generate Key]      |
|                                              |
| +------------------------------------------+|
| | My CLI Key         Created Feb 10, 2026  ||
| | Last used 2h ago                         ||
| | sol_live_a3f8...  [Copy]       [Revoke]  ||
| +------------------------------------------+|
| | Production Key    Created Jan 5, 2026    ||
| | Never used                               ||
| |               [Reveal] [Copy]  [Revoke]  ||
| +------------------------------------------+|
+---------------------------------------------+
```

### RLS

No RLS changes needed. The `api_keys` table already has policies allowing users to SELECT, INSERT, and UPDATE their own keys.

