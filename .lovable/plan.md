

# Tier 1 Security Fixes -- Implementation Plan

Four changes that harden the backend without affecting any user-facing flows or requiring CLI updates.

---

## 1. WEB-1: Chat Token Race Condition Fix

**What:** The `chat-token-update` function has a non-atomic fallback (lines 54-103) that does read-then-write, allowing concurrent requests to undercount token usage.

**Fix:** Delete the entire fallback block. If the `increment_chat_tokens` RPC fails, return a 500 error so the caller retries cleanly. The RPC is already atomic and handles all valid cases.

**File:** `supabase/functions/chat-token-update/index.ts`
- Remove lines 54-103 (the fallback block after the successful RPC return)
- If RPC errors, return `{ error: "Failed to update tokens" }` with status 500

**Impact:** None. The fallback code was dead weight that introduced the race condition.

---

## 2. WEB-3: Per-Audit Callback Authentication

**What:** `save-finding`, `complete-audit`, and `fail-audit` all use a single global `CALLBACK_SECRET`. If leaked, every audit is compromised.

**Fix:** Generate a per-audit HMAC token at session start, store it in the DB, and verify it per-audit in callback functions.

**Changes:**

### Database migration
- Add `callback_token TEXT` column to `audits` table

### `supabase/functions/_shared/verifyCallback.ts` (new file)
- Shared helper that:
  1. Reads `x-callback-token` header
  2. Looks up the audit by ID
  3. Uses constant-time comparison (`crypto.subtle.timingSafeEqual`) to verify token matches
  4. Returns `{ valid: boolean, error?: string }`

### `supabase/functions/cli-session-start/index.ts`
- After creating the audit, generate `callback_token = HMAC-SHA256(CALLBACK_SECRET, auditId)`
- Store it in the audit row
- Return `callback_token` in the response alongside `session_token`

### `supabase/functions/save-finding/index.ts`
- Replace global secret check (lines 50-67) with a call to `verifyCallback(req, finding.audit_id, supabase)`

### `supabase/functions/complete-audit/index.ts`
- Replace global secret check (lines 55-72) with `verifyCallback(req, audit_id, supabase)`

### `supabase/functions/fail-audit/index.ts`
- Replace global secret check (lines 23-40) with `verifyCallback(req, audit_id, supabase)`

**Impact on CLI:** The CLI **must** be updated to:
1. Store `callback_token` from the `cli-session-start` response
2. Send it as `x-callback-token` header on all callback requests (`save-finding`, `complete-audit`, `fail-audit`)

This is a **breaking change** for the CLI. The old global `CALLBACK_SECRET` header will no longer work once deployed.

---

## 3. WEB-8: Session Token Hashing

**What:** The `session_token` column stores plaintext JWTs. If the database is compromised, all active session tokens are exposed.

**Fix:** Store a SHA-256 hash instead of the plaintext JWT.

**Changes:**

### Database migration
- Add `session_token_hash TEXT` column to `audits` table

### `supabase/functions/cli-session-start/index.ts`
- After generating `sessionToken`, compute `SHA-256(sessionToken)` as hex
- Store the hash in `session_token_hash` instead of plaintext in `session_token`
- Set `session_token` to `NULL` (or stop writing to it)

### Future cleanup (separate migration later)
- Once confirmed working, drop the `session_token` column entirely

**Impact:** None externally. The JWT is returned to the CLI in the response and verified via its signature, not via DB lookup. The DB column was informational only.

---

## 4. WEB-7: Content Security Policy (Report-Only)

**What:** No CSP headers means zero XSS mitigation from the browser.

**Fix:** Add a `Content-Security-Policy-Report-Only` meta tag to `index.html`. Starting in report-only mode means nothing breaks -- the browser just logs violations to the console so we can tune the policy before enforcing.

**File:** `index.html`
- Add meta tag in `<head>`:

```text
<meta http-equiv="Content-Security-Policy-Report-Only"
  content="
    default-src 'self';
    script-src 'self' https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https://storage.googleapis.com https://*.googleusercontent.com;
    connect-src 'self' https://xylfnqrtzqfduutdcxvu.supabase.co https://api.razorpay.com https://lux-chat.razorpay.com;
    frame-src https://api.razorpay.com;
  ">
```

**Impact:** None. Report-only mode does not block anything. We monitor console for violations, then switch to enforcing later.

---

## Implementation Order

| Step | Item | Effort |
|------|------|--------|
| 1 | WEB-1: Delete fallback block in `chat-token-update` | ~5 min |
| 2 | WEB-8: Add `session_token_hash`, update `cli-session-start` | ~15 min |
| 3 | WEB-3: Add `callback_token`, create shared verifier, update 4 functions | ~30 min |
| 4 | WEB-7: Add CSP report-only meta tag | ~5 min |

## Technical Notes

- WEB-3 is a **breaking change for the CLI**. You will need to update the CLI to send `callback_token` before deploying this change to production.
- WEB-7 uses `Content-Security-Policy-Report-Only` so it is safe to deploy immediately. The `connect-src` includes the Supabase project URL and Razorpay domains.
- WEB-8 uses a dual-column approach (`session_token` + `session_token_hash`) so existing sessions are not disrupted during rollout.

