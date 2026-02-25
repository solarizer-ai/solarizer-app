

# Simplify Credit Architecture — Deduct-Upfront Model

## Overview
Replace the 3-phase reserve-commit-release credit pattern with a simpler deduct-at-start model. On success, zero credit operations happen after the initial deduction. Only failure/cancellation triggers a refund.

```text
CURRENT:  start -> reserve  |  complete -> commit  |  fail/cancel -> release
NEW:      start -> deduct   |  complete -> nothing  |  fail/cancel -> refund
```

## Database Changes (Migration)

### 1. Replace `cli_refund_credits` RPC
The existing `cli_refund_credits` doesn't clamp refunds to `credits_used_this_period`. Replace it with the spec version that uses `LEAST(p_amount, credits_used_this_period)` to prevent negative values, and logs a `type='refund'` transaction.

### 2. Data migration for in-flight audits
- Return any reserved credits (`credits_reserved > 0`) back to users' `credits_remaining`
- Mark in-flight audits with reserved credits as failed

### 3. Drop old RPCs (after verification)
- `cli_reserve_credits`
- `cli_commit_credits`  
- `cli_release_credits`

### 4. Update `auto_settle_stale_sessions`
Replace proportional commit+release logic with a full refund using `cli_refund_credits`. Under the deduct-upfront model, stale sessions get a full refund since there's no partial commit concept.

## Edge Function Changes

### A3. `cli-audit-start` (supabase/functions/cli-audit-start/index.ts)
- Replace `cli_reserve_credits` call with `cli_deduct_credits`
- Rename tracking variables: `creditsReserved` -> `creditsDeducted`
- Update audit INSERT: `credits_deducted: estimatedCost, credits_reserved: 0`
- Replace all `cli_release_credits` cleanup calls with `cli_refund_credits`

### A4. `cli-audit-complete` (supabase/functions/cli-audit-complete/index.ts)
- Remove the entire `cli_commit_credits` RPC block (lines 121-143) and its lock rollback logic
- Keep the `is_locked` CAS and grade calculation
- Update final audit UPDATE to preserve existing `credits_deducted` value

### A5. `cli-audit-fail` (supabase/functions/cli-audit-fail/index.ts)
- Change SELECT from `credits_reserved` to `credits_deducted`
- Replace `cli_release_credits` with `cli_refund_credits`
- Update CAS to zero out `credits_deducted` instead of `credits_reserved`

### A6. `cli-audit-cancel` (supabase/functions/cli-audit-cancel/index.ts)
- Change SELECT from `credits_reserved` to `credits_deducted`
- Replace `cli_release_credits` with `cli_refund_credits`

### A7. Delete `cli-commit-contract` edge function
- Delete `supabase/functions/cli-commit-contract/index.ts`

### Additional: `cli-session-start` (supabase/functions/cli-session-start/index.ts)
- Replace `cli_reserve_credits` with `cli_deduct_credits`
- Replace `cli_release_credits` with `cli_refund_credits`
- Update audit INSERT: `credits_deducted: estimated_cost, credits_reserved: 0`
- Update `credit_txns` link from `type: 'reservation'` to `type: 'deduction'`

### Additional: `cli-session-end` (supabase/functions/cli-session-end/index.ts)
- Remove the completed path's `cli_commit_credits` call (credits already deducted)
- Replace the failed/cancelled path's `cli_commit_credits` and `cli_release_credits` with a full `cli_refund_credits`
- Simplify: on failure/cancellation, refund `credits_deducted` fully

### Additional: `fail-audit` (supabase/functions/fail-audit/index.ts)
- Replace `cli_release_credits` with `cli_refund_credits`
- Use `credits_deducted` instead of `credits_reserved` for the refund amount

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Replace `cli_refund_credits`, update `auto_settle_stale_sessions`, migrate in-flight data, drop old RPCs |
| `cli-audit-start/index.ts` | Deduct upfront, refund on error |
| `cli-audit-complete/index.ts` | Remove commit block, keep CAS + grade |
| `cli-audit-fail/index.ts` | Refund `credits_deducted` |
| `cli-audit-cancel/index.ts` | Refund `credits_deducted` |
| `cli-session-start/index.ts` | Deduct upfront, refund on error |
| `cli-session-end/index.ts` | Simplify to refund-only on failure |
| `fail-audit/index.ts` | Refund `credits_deducted` |
| `cli-commit-contract/index.ts` | **DELETE** |

## Deployment Order
1. Run migration (new RPC + data cleanup + updated `auto_settle_stale_sessions`)
2. Deploy all edge functions simultaneously
3. Delete `cli-commit-contract` function
4. Verify with test scenarios
5. Drop old RPCs after confirmation
