

# Fix `verifyServiceSecret` — Replace Unsupported `timingSafeEqual`

## Problem
The `crypto.subtle.timingSafeEqual` method is not available in the Supabase Edge Functions Deno runtime, causing all functions that use `verifyServiceSecret` (like `cli-audit-progress`, `fail-audit`) to crash with:
```
crypto.subtle.timingSafeEqual is not a function
```

This is why audits get stuck in "queued" — the proxy's progress updates are rejected.

## Fix
Replace the `crypto.subtle` call with a manual constant-time byte comparison using XOR, which works in any JavaScript runtime.

**File:** `supabase/functions/_shared/verifyServiceSecret.ts`

```typescript
export function verifyServiceSecret(req: Request): boolean {
  const secret = req.headers.get('x-service-secret');
  const expected = Deno.env.get('SESSION_SECRET');

  if (!secret || !expected) return false;

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(expected);

  if (a.byteLength !== b.byteLength) return false;

  // Constant-time comparison via XOR
  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}
```

## Affected Functions (redeploy all)
All functions that import `verifyServiceSecret`:
- `cli-audit-progress`
- `fail-audit`
- `chat-budget-check`
- `chat-token-update`

## After Fix
The stuck "Test One" audit should be retried (or failed/refunded) since its orchestration row is already in a broken state.

