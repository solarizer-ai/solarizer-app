

# Post-Simplification Round 2 — Implementation Plan

## Overview

5 changes: refund error logging, merge duplicate fail functions, drop `credits_reserved` column, add idempotency keys, and add credit reconciliation.

## B1. Add refund error logging in `cli-audit-fail` and `cli-audit-cancel`

### `cli-audit-fail/index.ts` (lines 96-103)
Wrap the fire-and-forget `cli_refund_credits` call with error capture and CRITICAL logging, matching the pattern already used in `cli-audit-start` and `cli-session-start`.

### `cli-audit-cancel/index.ts` (lines 102-109)
Same pattern — capture refund error and log with CRITICAL prefix.

## B3. Drop `credits_reserved` column

### Database migration
- Update `auto_settle_stale_sessions` to use `credits_deducted` (already done in the function body, but the column reference needs cleanup)
- `ALTER TABLE public.audits DROP COLUMN IF EXISTS credits_reserved`
- `ALTER TABLE public.nloc_credits DROP COLUMN IF EXISTS credits_reserved`

### Edge function cleanup (remove `credits_reserved: 0` from all UPDATE/INSERT statements)

| File | Lines | Change |
|------|-------|--------|
| `cli-audit-complete/index.ts` | 127 | Remove `credits_reserved: 0` from UPDATE |
| `fail-audit/index.ts` | 121 | Remove `credits_reserved: 0` from UPDATE |
| `cli-session-end/index.ts` | 206, 268 | Remove `credits_reserved: 0` from two UPDATEs |
| `cli-session-start/index.ts` | 172 | Remove `credits_reserved: 0` from INSERT |
| `cli-audit-start/index.ts` | 188 | Remove `credits_reserved: 0` from INSERT |

The `types.ts` file will auto-regenerate after the column drop migration.

## B5. Credit reconciliation function

### Database migration (combined with B3)
Add `cli_reconcile_credits()` function that compares `nloc_credits.credits_remaining` against the sum of all `credit_txns.amount` for each user. Returns rows where drift exceeds 0.01. This is a diagnostic tool for manual or scheduled use.

## B4. Idempotency key enforcement

### Database migration
- Add nullable `idempotency_key TEXT` column to `audits`
- Create partial unique index: `CREATE UNIQUE INDEX idx_audits_idempotency_key ON public.audits (idempotency_key) WHERE idempotency_key IS NOT NULL`

### `cli-session-start/index.ts`
Accept optional `idempotency_key` in request body. Before creating the audit, check for an existing audit with the same key. If found, return the existing session_id with `duplicate: true`. Include `idempotency_key` in the audit INSERT.

### `cli-audit-start/index.ts`
Same pattern — check for existing audit with matching idempotency key before creating a new one.

## B2. Merge `cli-audit-fail` and `fail-audit` into single `fail-audit`

### Merged `fail-audit/index.ts`
Rewrite to combine both functions:
1. **Dual auth**: Try `verifyServiceSecret` first, fall back to `verifyCallback`
2. **Dual ID field**: Accept both `sessionId` and `audit_id`, normalize to single variable
3. **Orchestration update**: Always attempt update on `audit_orchestration` (idempotent, ignores zero-row result)
4. **Atomic CAS locking**: Single `UPDATE ... WHERE is_locked = false` returning `id, user_id, credits_deducted`
5. **Refund with error logging**: Capture and log CRITICAL on refund failure
6. **Rich response**: `{ success, audit_id, credits_refunded }`

### Delete `cli-audit-fail` directory
Remove the function and its `config.toml` entry.

## Files Modified

| File | Changes |
|------|---------|
| Migration SQL | Drop `credits_reserved` columns, add `idempotency_key`, add `cli_reconcile_credits` |
| `cli-audit-fail/index.ts` | B1 refund logging, then DELETE in B2 |
| `cli-audit-cancel/index.ts` | B1 refund logging |
| `fail-audit/index.ts` | B2 merge (full rewrite), B3 remove `credits_reserved` |
| `cli-audit-complete/index.ts` | B3 remove `credits_reserved` |
| `cli-session-end/index.ts` | B3 remove `credits_reserved` (2 locations) |
| `cli-session-start/index.ts` | B3 remove `credits_reserved`, B4 idempotency key |
| `cli-audit-start/index.ts` | B3 remove `credits_reserved`, B4 idempotency key |

## Deployment Order
1. Run migration (drop columns, add idempotency key, add reconciliation function)
2. Deploy all edge functions simultaneously
3. Delete `cli-audit-fail` function
4. Verify with test scenarios

