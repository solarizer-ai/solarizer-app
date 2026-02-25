

# Edge Function Safety Hardening — 9 Fixes

## A1. Atomic credit settlement in `cli-audit-complete` (CRITICAL)

**File:** `supabase/functions/cli-audit-complete/index.ts`

Two changes:

1. **Orchestration update (lines 46-56):** Add `.in('status', ['queued', 'running'])` guard and `.select('session_id')`. If zero rows match, return early with `{ success: true, already_completed: true }`.

2. **Credit settlement (lines 70-120):** Replace the read-then-check `is_locked` pattern with an atomic `UPDATE ... WHERE is_locked = false` with `.select('user_id, credits_reserved, contracts_total')`. If zero rows returned, the audit is already settled -- skip and return success. Grade calculation and credit commit logic remain the same but operate on the locked row.

## A2. Fix `cli-audit-fail` zero-row detection (CRITICAL)

**File:** `supabase/functions/cli-audit-fail/index.ts` (lines 44-60)

Add `.select('session_id')` to the orchestration update. After the error check, if zero rows matched, log and return `{ success: true, skipped: true }` -- skipping the credit release path entirely.

## A3. Fix `cli-audit-start` outer catch cleanup (HIGH)

**File:** `supabase/functions/cli-audit-start/index.ts`

Add tracking variables (`creditsReserved`, `reservedAmount`, `reservedUserId`, `createdSessionId`) inside the try block. Set them after successful credit reservation and audit creation. In the outer catch (lines 273-280), release credits and delete orphaned audit rows using these flags.

## A4. Fix `cli-audit-cancel` — add `user_id` filter + status fix (HIGH)

**File:** `supabase/functions/cli-audit-cancel/index.ts`

1. Line 81: Add `.eq('user_id', authResult.userId)` to the audits query to prevent cross-user cancellation.
2. Line 95: Change `status: 'failed'` to `status: 'cancelled'` for semantic correctness.

## A5. Fix `verifyServiceSecret` timing comparison (HIGH)

**File:** `supabase/functions/_shared/verifyServiceSecret.ts`

Replace the dummy `timingSafeEqual(a, a)` approach with proper padding: create equal-length `Uint8Array` buffers, copy both inputs, compare with `timingSafeEqual`, then verify original lengths match.

## A6. Add status guard to `cli-audit-progress` (HIGH)

**File:** `supabase/functions/cli-audit-progress/index.ts` (lines 45-73)

Add `.in('status', ['queued', 'running'])` to the update. When `updateError` occurs (which Supabase returns when `.single()` matches zero rows), fall back to reading the current `aborted` flag and return it (defaulting to `true` so the proxy stops).

## A7. Fix `apiKeyAuth` prefix length (MEDIUM)

**File:** `supabase/functions/_shared/apiKeyAuth.ts` (line 22)

The current prefix `'sol_live'` (8 chars) is identical for all keys, making the DB query return all non-revoked keys.

Two changes needed:
1. **Key generation** (`supabase/functions/cli-generate-api-key/index.ts`, line 90): Change `keyPrefix` to `fullKey.substring(0, 16)` (captures `sol_live_` + 7 hex chars).
2. **Key lookup** (`supabase/functions/_shared/apiKeyAuth.ts`, line 22): Change to `apiKey.substring(0, 16)`.

Existing keys in the DB all have `key_prefix = 'sol_live'` and won't match a 16-char lookup. A migration is needed to backfill prefixes from decrypted keys, OR we add a fallback: if the 16-char prefix returns no results, retry with the 8-char prefix. The fallback approach avoids a complex migration.

## A8. Add input bounds to `cli-audit-start` (MEDIUM)

**File:** `supabase/functions/cli-audit-start/index.ts`

After the `scopeFiles` empty check (line 77), add validation for max 50 scope files and max 50,000 total nLOC.

## A9. Strip file content from `request_payload` (MEDIUM)

**File:** `supabase/functions/cli-audit-start/index.ts` (lines 202-208)

Strip `content` fields from scope and context files in the stored `request_payload`. Only store `{ path, nLOC, complexity }` for scope files and `{ path, nLOC }` for context files. Replace `additionalContext` with a length summary.

---

## Files Modified

| File | Fixes |
|------|-------|
| `supabase/functions/cli-audit-complete/index.ts` | A1: Atomic orchestration guard + atomic lock settlement |
| `supabase/functions/cli-audit-fail/index.ts` | A2: Zero-row detection, skip credit release |
| `supabase/functions/cli-audit-start/index.ts` | A3: Outer catch cleanup, A8: Input bounds, A9: Strip content |
| `supabase/functions/cli-audit-cancel/index.ts` | A4: user_id filter + cancelled status |
| `supabase/functions/_shared/verifyServiceSecret.ts` | A5: Proper constant-time padding |
| `supabase/functions/cli-audit-progress/index.ts` | A6: Status guard on update |
| `supabase/functions/_shared/apiKeyAuth.ts` | A7: Extended prefix with fallback |
| `supabase/functions/cli-generate-api-key/index.ts` | A7: Store 16-char prefix |

No new tables, migrations, secrets, or environment variables needed.

