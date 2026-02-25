

# Simplify Credit Architecture — Deduct-Upfront Model ✅ IMPLEMENTED

## Status: Complete

All changes deployed. The 3-phase reserve-commit-release pattern has been replaced with a simpler deduct-at-start model.

```text
OLD:  start → reserve  |  complete → commit  |  fail/cancel → release
NEW:  start → deduct   |  complete → nothing  |  fail/cancel → refund
```

## What was done

### Database Migration
- ✅ Updated `cli_deduct_credits` RPC (adds `credits_used_this_period` tracking)
- ✅ Replaced `cli_refund_credits` RPC (clamped to prevent negative `credits_used_this_period`)
- ✅ Updated `auto_settle_stale_sessions` (full refund instead of proportional settlement)
- ✅ Migrated in-flight data (returned reserved credits, failed stale audits)
- ✅ Dropped `cli_reserve_credits`, `cli_commit_credits`, `cli_release_credits`

### Edge Functions Updated
- ✅ `cli-audit-start` — deduct upfront, refund on error
- ✅ `cli-audit-complete` — removed commit block, keep CAS + grade
- ✅ `cli-audit-fail` — refund `credits_deducted`
- ✅ `cli-audit-cancel` — refund `credits_deducted`
- ✅ `cli-session-start` — deduct upfront, refund on error
- ✅ `cli-session-end` — simplified to refund-only on failure
- ✅ `fail-audit` — refund `credits_deducted`

### Deleted
- ✅ `cli-commit-contract` edge function removed
