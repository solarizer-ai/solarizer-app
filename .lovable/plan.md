
# Audit Flow Hardening — Implementation Plan

## Overview
This plan applies 12 changes across edge functions, frontend components, hooks, and database to fix tier-downgrade bugs, remove the floating scan widget, add locked tabs for Spark users, enforce server-side nLOC limits, and add idempotency protection.

---

## 1. Fix plan limits in `src/lib/nlocCalculator.ts`
- Set `starter.initialCredits` to `50` (was `0`)
- Set `business.nlocPerScan` to `9999` (was `12000`)
- Remove `maxFilesPerScan` from starter
- Remove `unlimitedScans` and `teamMembers`/`sharing` from pro/business (keep only `nlocPerScan` and `initialCredits`)

## 2. AuditProgressPanel — remove phantom phases + staleness thresholds

**`src/components/AuditProgressPanel.tsx`:**
- Remove `complexity_estimation` and `session_start` from PHASES array (keep only: hunting, cross_contract, validation, qa, formatting, reporting)
- Change staleness thresholds: `warn` at 1800s (30 min), `stuck` at 3600s (60 min)

## 3. Reduce polling in `src/hooks/useAuditProgress.ts`
- Change `refetchInterval: 2000` to `refetchInterval: 10000`

## 4. Extend OrchestrationProgress in `src/contexts/ScanContext.tsx`
- Add `crossContractPass`, `crossContractTotal`, `skippedPhases` to the interface
- (Already partially done; verify and add missing fields)

## 5. Fix navigate/startScan order in `src/pages/dashboard/NewAuditPage.tsx`
- Swap `navigate("/dashboard")` and `startScan(...)` so `startScan` fires first

## 6. Fix EstimatorStep nLOC validation in `src/components/wizard/EstimatorStep.tsx`
- Change `getValidationStatus()` to check `scopeNloc + contextNloc` (total) against plan limit instead of just `scopeNloc`
- Remove the `maxFilesPerScan` check (field no longer exists)
- Update error message to say "Total nLOC"

## 7. Remove ScanProgressWidget entirely

**Delete:** `src/components/ScanProgressWidget.tsx`

**Remove render sites:**
- `src/pages/dashboard/DashboardHome.tsx`: Remove import, remove `<ScanProgressWidget .../>` block (lines 256-266), remove destructuring of widget-only state from `useScan()`
- `src/pages/Index.tsx`: Remove import, remove `<ScanProgressWidget .../>` block (lines 319-327), remove destructuring of widget-only state from `useScan()`

**Simplify `src/contexts/ScanContext.tsx`:**
- Remove `showWidget` state and `closeWidget` function
- Remove `orchestrationPhase`, `orchestrationProgress`, `realtimeFindings`, `realtimeAuditStatus` from context value export
- Keep realtime subscriptions for cache invalidation
- Keep `startScan` but simplify to only set up subscriptions and show toast
- Remove the orchestration channel subscription (no longer needed without widget)

## 8. Locked tabs for Spark users on Report page

**`src/pages/Report.tsx`:**
- Use `effectivePlan` from the existing `useReportFeatureAccess` hook (already imported) to detect Spark users
- For the Invariants and Insights tab triggers: add a Lock icon when `effectivePlan === 'starter'`
- For the tab content: wrap `InvariantsTab` and `InsightsTab` in a conditional — show `FeatureLockedOverlay` for Spark users with:
  - Invariants: `featureName="System Invariants"`, `requiredPlan="pro"`, `description="Invariant analysis identifies protocol-level assumptions that must always hold."`
  - Insights: `featureName="Architecture Insights"`, `requiredPlan="pro"`, `description="Architecture insights provide a high-level review of protocol design and composability risks."`
- Wire `onUpgrade` to open the existing upgrade modal

## 9. Server-side nLOC plan limit + idempotency + proxy refund in `web-audit-start`

**`supabase/functions/web-audit-start/index.ts`:**

**A) Plan nLOC limit check** — After the subscription expiry check (line 268), before credits fetch:
```
const PLAN_NLOC_LIMITS = { starter: 500, pro: 3000, business: 9999 };
if (scopeNloc + contextNloc > limit) return 402
```

**B) Idempotency key** — Destructure `idempotency_key` from body, add lookup before credits check, pass to audit insert

**C) Proxy failure refund** — Remove the inner try-catch around the proxy call (lines 338-360). Replace with a direct call that throws on non-2xx, letting the outer catch handle refund

## 10. Server-side nLOC recalculation in `cli-audit-start`

**`supabase/functions/cli-audit-start/index.ts`:**
- Copy the `calculateServerNLOC` function (and its helpers `removeComments`, `removeStringLiterals`, `countLogicalUnits`) from `web-audit-start`
- After parsing body, recalculate nLOC server-side for scope and context files
- Add the same PLAN_NLOC_LIMITS check as item 9A (after tier is determined, before credits check)

## 11. Generate idempotency key in `src/hooks/useRunAudit.ts`
- Before calling `invokeWithRefresh`, generate `crypto.randomUUID()`
- Include `idempotency_key` in the request body

## 12. DB migration — one active audit per user
Create a unique partial index on `audit_orchestration(user_id)` where status is `queued` or `running` to prevent race conditions.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_audit_per_user
  ON audit_orchestration(user_id)
  WHERE status IN ('queued', 'running');
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/lib/nlocCalculator.ts` | Edit |
| `src/components/AuditProgressPanel.tsx` | Edit |
| `src/hooks/useAuditProgress.ts` | Edit |
| `src/contexts/ScanContext.tsx` | Edit (simplify) |
| `src/pages/dashboard/NewAuditPage.tsx` | Edit |
| `src/components/wizard/EstimatorStep.tsx` | Edit |
| `src/components/ScanProgressWidget.tsx` | Delete |
| `src/pages/dashboard/DashboardHome.tsx` | Edit (remove widget) |
| `src/pages/Index.tsx` | Edit (remove widget) |
| `src/pages/Report.tsx` | Edit (locked tabs) |
| `supabase/functions/web-audit-start/index.ts` | Edit |
| `supabase/functions/cli-audit-start/index.ts` | Edit |
| `src/hooks/useRunAudit.ts` | Edit |
| `supabase/migrations/` | New migration file |

## Deployment Note
Edge functions (`web-audit-start`, `cli-audit-start`) will be deployed automatically after editing. The DB migration will be applied via the migration tool.
