

# Reserve + Commit Billing Model

This plan replaces the current "deduct upfront, refund on failure" credit model with a "reserve, commit, release" pattern. Users are only charged for work actually completed.

## What Changes

**Before:** Credits are deducted at audit start. On failure, a separate refund transaction is created -- producing 2 transactions per failed audit and a bug where `fail-audit` refunds raw nLOC instead of complexity-adjusted credits.

**After:** Credits are frozen (reserved) at audit start. On completion, the earned portion is committed. On failure, reserved credits return silently. Users see 1 clean transaction instead of 2.

## Implementation Steps

### Step 1: Database Migration

A single migration adding columns, constraints, RPCs, and the cron job.

**Schema changes:**
- `nloc_credits`: add `credits_reserved NUMERIC(12,2) NOT NULL DEFAULT 0` with a `CHECK (credits_reserved >= 0)` constraint
- `audits`: add `credits_reserved NUMERIC(12,2) NOT NULL DEFAULT 0` and `last_heartbeat TIMESTAMPTZ`
- `credit_txns`: expand type CHECK to include `reservation`, `commit`, `release`

**New RPCs (exact SQL from spec):**
- `cli_reserve_credits` -- moves credits from `credits_remaining` to `credits_reserved`, logs a `reservation` txn
- `cli_commit_credits` -- moves credits from `credits_reserved` to `credits_used_this_period`, logs a `commit` txn
- `cli_release_credits` -- moves credits from `credits_reserved` back to `credits_remaining`, logs a `release` txn
- `auto_settle_stale_sessions` -- settles abandoned sessions (no heartbeat for 12+ hours) proportionally using `FOR UPDATE SKIP LOCKED`; the UPDATE in the loop must set `status = 'failed'`, `is_locked = true`, `credits_reserved = 0`, and `error_message` to prevent re-processing

**Cron job (via insert tool, not migration):**
- Schedule `auto_settle_stale_sessions` hourly via `pg_cron` + `pg_net`

---

### Step 2: Update `cli-session-start`

Surgical changes only -- all existing logic (JWT signing, audit creation, callback token, etc.) stays intact.

- Replace `cli_deduct_credits` RPC call with `cli_reserve_credits` (same params, different RPC name, updated description string)
- In the audit INSERT: set `credits_deducted: 0` and `credits_reserved: estimated_cost`
- On audit creation failure: call `cli_release_credits` instead of `cli_refund_credits` (this is an improvement over the spec -- release reserved credits rather than refund deducted ones)
- Update the `credit_txns` linking query to match type `reservation` instead of `deduction`
- Return `remaining_credits` from the reserve result

---

### Step 3: Update `cli-session-end` (CRITICAL -- preserve existing behavior)

This is a surgical modification. The existing function has grade calculation, status mapping (`completed` to `issues`/`secured`), coverage merge, hologram merge, and `is_locked` idempotency -- all of which must be preserved exactly as-is.

**3a. MODIFY the audit SELECT (carefully append to existing field list):**
```
// Before:
.select('id, user_id, is_locked, credits_deducted, contracts_completed, contracts_total')

// After:
.select('id, user_id, is_locked, credits_deducted, credits_reserved, contracts_completed, contracts_total')
```

**3b. REMOVE the old `cli_refund_credits` block** (the block that calculates `unprocessedRatio` and calls `cli_refund_credits`)

**3c. ADD the credit settlement block** in place of the removed refund block, with backwards-compatibility guard:
- Read `contractsCompleted`, `contractsTotal`, `creditsReserved` from audit/body
- If `creditsReserved === 0 && audit.credits_deducted > 0`: keep the existing refund logic unchanged (for pre-migration audits)
- If `creditsReserved > 0`:
  - Completed: call `cli_commit_credits` for full reserved amount
  - Failed/cancelled: calculate `commitRatio = contractsCompleted / contractsTotal`, commit the proportional amount, release the remainder

**3d. MODIFY both existing `.update()` calls** (completed path and failed/cancelled path):
- Add `last_heartbeat: null` and `credits_reserved: 0` to both

**3e. KEEP unchanged:**
- JWT verification, `verifySessionJWT`, all imports
- `is_locked` idempotency check (early return if already locked)
- Grade calculation via `calculateGradeFromFindings`
- Status mapping (`severities.some(...)` logic)
- Coverage data merge (test deduplication via `testMap`)
- System hologram merge
- All error handling and CORS

---

### Step 4: Update `fail-audit` (fix nLOC vs credits bug)

**4a. Update the audit SELECT** to fetch `credits_reserved` and `credits_deducted` instead of `nloc_count`:
```
.select('id, user_id, credits_reserved, credits_deducted, is_locked, status')
```

**4b. Replace the `refund_credits` RPC** with `cli_release_credits`:
- Backwards-compatible: use `audit.credits_reserved || audit.credits_deducted || 0` as the amount
- Call `cli_release_credits` with description `'Full release: proxy failure'`

**4c. Update the audit record after release** -- this is critical and must include all fields:
```
status: 'failed',
is_locked: true,
credits_reserved: 0,
error_message: error_message || 'Proxy failure',
updated_at: new Date().toISOString(),
```

**4d. KEEP unchanged:**
- CORS handling (server-to-server only, 403 on OPTIONS)
- `verifyCallback` auth
- `is_locked` idempotency check

---

### Step 5: Create `cli-session-progress` (new edge function)

A dual-mode heartbeat/query endpoint. Critical implementation details:

**CORS:** Must include standard CORS headers and OPTIONS handler (consistent with all other edge functions).

**Auth:** Session JWT via `Authorization: Bearer <token>`, verified with `SESSION_SECRET`. Extract audit ID from `verification.payload.sessionId` (NOT `audit_id`) because `cli-session-start` signs JWTs with `{ sessionId: auditId }`.

**Heartbeat mode (default):** Updates `last_heartbeat`, `contracts_completed`, `contracts_total`, `findings_count`, `current_phase` on the audit record.

**Query mode (`{ query: true }`):** Returns audit `status`, `credits_reserved`, `credits_deducted`, `is_locked`, `error_message`, and a computed `resumable` boolean (`status === 'analyzing' && !is_locked && (credits_reserved > 0 || credits_deducted > 0)`).

**Config:** Add to `supabase/config.toml`:
```
[functions.cli-session-progress]
verify_jwt = false
```

---

### Step 6: Frontend -- Credit Activity Display

**`src/components/settings/CreditActivityLog.tsx`:** Add new entries to the `typeConfig` map:
- `reservation`: icon Lock, color amber/warning, label "Reserved", badge variant outline
- `commit`: icon ArrowDown, color destructive, label "Committed", badge variant destructive
- `release`: icon RotateCcw, color success, label "Released", badge variant default
- `subscription_grant`: map to existing `grant` config (already handled by fallback, but explicit is better)

**`src/hooks/useCreditActivity.ts`:** No changes needed -- the type field is already a string and the query is generic.

## Backwards Compatibility

- Pre-migration audits (`credits_deducted > 0`, `credits_reserved = 0`) continue using the existing refund path in `cli-session-end`
- `fail-audit` checks both `credits_reserved` and `credits_deducted`
- Old refund path can be removed after 24 hours once all active audits complete

