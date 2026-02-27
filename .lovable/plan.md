

# Subscription Enforcement, Locked Phases, and Credit Gating

## Overview
This plan addresses a silent tier-downgrade bug where users without an active subscription could start audits that ran as `tier=free`, producing incomplete reports. It also enforces credit minimums and updates the purchase modal.

## Changes

### 1. Edge Functions -- Enforce Active Subscription (403)

**`supabase/functions/cli-audit-start/index.ts`** (lines ~141-145)
- Change `select('plan')` to `select('plan, status, current_period_end')`
- Replace `const tier = subscription?.plan || 'free'` with a guard: if no subscription row, return 403 with `"No active subscription. Please subscribe to start an audit."`
- Add expiry check: if `current_period_end` is in the past, return 403 with `"Your subscription has expired. Please renew to continue."`
- Set `const tier = subscription.plan` (no fallback)

**`supabase/functions/web-audit-start/index.ts`** (lines ~248-250)
- Same changes as above

### 2. Frontend Subscription Gate -- `NewAuditPage.tsx`

- Destructure `isExpired` from `useSubscription()`
- Compute `hasActivePlan = subscription?.status === 'active' && !isExpired`
- If `!hasActivePlan`, render a lock screen with:
  - Back button + "New Security Analysis" title (same header)
  - Card with Lock icon, "Subscription Required" heading
  - Description: "A Spark, Blaze, or Inferno plan is required to run security audits."
  - "View Plans" button navigating to `/pricing`
- Import `Lock` from lucide-react, `Card`/`CardContent` from ui/card

### 3. Credit Insufficiency Gate -- `NewAuditPage.tsx`

- Also check if user has zero credits (`!credits || credits.credits_remaining <= 0`)
- Show a similar card: "Insufficient Credits" with description "You need credits to run security audits. Purchase credits to get started."
- "Purchase Credits" button that opens the PurchasePowerUpModal
- This is separate from the per-audit credit check in the wizard estimator -- it catches users with literally zero credits before they even start

### 4. `useAuditProgress.ts` -- Add `skippedPhases`

Add `skippedPhases?: string[]` to the `progress` type in `AuditOrchestrationProgress`. No query changes needed.

### 5. `AuditProgressPanel.tsx` -- Render Locked Phases

- Import `Lock` from lucide-react
- Derive `skippedPhases` set from `orchestration.progress.skippedPhases`
- In the phase render loop, add a fourth state `isLocked`:
  - If locked: show `Lock` icon (gray), phase label with "Not included on this plan" subtitle
  - Locked phases don't count as completed/active/pending
- Locked phases appear grayed out with the lock icon

### 6. `useRunAudit.ts` -- Surface 403 Error Messages

- After `invokeWithRefresh`, if `error` exists, attempt to parse `error.message` as JSON to extract the `error` field
- This ensures messages like "No active subscription..." and "Your subscription has expired..." surface in the toast via the existing `NewAuditPage` error handler

### 7. `PurchasePowerUpModal.tsx` -- Minimum 25 Credits

- Change `MIN_CREDITS` from `100` to `25`
- Update `QUICK_OPTIONS` to `[25, 100, 500, 1000]` (remove 2500/5000, add 25)
- Update the validation message accordingly

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/cli-audit-start/index.ts` | Enforce active subscription (403) |
| `supabase/functions/web-audit-start/index.ts` | Enforce active subscription (403) |
| `src/pages/dashboard/NewAuditPage.tsx` | Subscription + credit gate before wizard |
| `src/hooks/useAuditProgress.ts` | Add `skippedPhases` to progress type |
| `src/components/AuditProgressPanel.tsx` | Render locked phase state with Lock icon |
| `src/hooks/useRunAudit.ts` | Parse JSON error body for 403 messages |
| `src/components/PurchasePowerUpModal.tsx` | Change MIN_CREDITS to 25 |

## No Database Changes Required
All changes are in edge functions and frontend code.

