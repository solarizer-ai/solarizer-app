

# Fix Chat Session JWT + Add Token Increment RPC

## Summary

Two fixes required for the CLI chat feature to work end-to-end:

1. The `chat-session-init` edge function does not generate a signed JWT, causing 401 errors on the Cloud Run proxy.
2. The `increment_chat_tokens` RPC function (called by the Cloud Run proxy to update token usage) does not exist in the database.

## Changes

### 1. Update Edge Function: `supabase/functions/chat-session-init/index.ts`

Add JWT signing so the response includes a `chat_session_token` field:

- Import `base64url` from Deno standard library
- Add the `signJWT()` helper (HMAC-SHA256, same as `cli-session-start`)
- Read `SESSION_SECRET` from environment (already configured in secrets)
- Generate a JWT with payload: `chatSessionId`, `userId`, `tokenBudget`, `tokensUsed`, `feature: 'chat'`, `iat`, `exp`
- Return `chat_session_token` in **both** response paths (resume existing session and create new session)

### 2. Database Migration: Create `increment_chat_tokens` RPC

Create a `SECURITY DEFINER` PostgreSQL function that atomically increments `tokens_used` on a `chat_sessions` row. Called by the Cloud Run proxy after each Gemini API call.

```sql
CREATE OR REPLACE FUNCTION public.increment_chat_tokens(
  p_session_id UUID,
  p_tokens INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_tokens_used INTEGER;
BEGIN
  UPDATE public.chat_sessions
  SET tokens_used = tokens_used + p_tokens, updated_at = now()
  WHERE id = p_session_id
  RETURNING tokens_used INTO v_new_tokens_used;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat session not found: %', p_session_id;
  END IF;

  RETURN v_new_tokens_used;
END;
$$;
```

### 3. No New Secrets Needed

`SESSION_SECRET` is already configured in the project secrets (confirmed in the secrets list). It is the same secret used by `cli-session-start` and the Cloud Run proxy.

## Technical Details

### JWT Payload (matches Cloud Run proxy expectations)

| Field | Type | Value |
|-------|------|-------|
| chatSessionId | string | UUID of chat_sessions row |
| userId | string | Authenticated user UUID |
| tokenBudget | number | Tier-based budget (50k/900k/2.16M) |
| tokensUsed | number | Current usage from session |
| feature | string | Always `'chat'` |
| iat | number | Unix seconds (issued at) |
| exp | number | Unix seconds (matches session expires_at) |

### Files Modified

- `supabase/functions/chat-session-init/index.ts` -- Add signJWT helper, base64url import, JWT generation in both response paths
- New SQL migration -- Create `increment_chat_tokens` RPC function

### No Other Changes

No existing edge functions, tables, or frontend code are modified.
