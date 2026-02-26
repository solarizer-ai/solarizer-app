

# Server-Side Batch Estimation + Audit Progress Sync

## Overview
Two improvements: (1) Replace the client-side credit estimator with a server call to Cloud Run `/estimate/batch`, and (2) subscribe to `audit_orchestration` Realtime updates so the scan progress widget shows live phase labels like "Hunting: Vault.sol -- initial scan (1/3)".

## Changes

### Part A: SQL Migration
Enable Realtime on `audit_orchestration` so UPDATE events stream to the frontend.

```sql
ALTER TABLE public.audit_orchestration REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_orchestration;
```

### Part B: New Edge Function -- `web-estimate`
Create `supabase/functions/web-estimate/index.ts`:
- Authenticates via JWT
- Validates file payload (max 100 files, 1MB per file)
- Proxies to Cloud Run `/estimate/batch` with `x-service-secret`
- Returns proxy response unchanged (no credit deduction -- read-only)
- Uses existing secrets: `CLOUD_RUN_PROXY_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Part C: Replace `EstimatorStep.tsx`
Full rewrite of `src/components/wizard/EstimatorStep.tsx`:
- Remove `useMemo` + `calculateNLOC` client-side logic
- Add `useState` + `useEffect` that calls `invokeWithRefresh('web-estimate', { body: { scopeFiles, contextFiles } })`
- Three states: loading (spinner + "Analyzing contracts..."), error (retry button), success (per-file table)
- Success view shows per-file rows: filename, nLOC, L1/L2/L3 complexity badge, credit cost
- Context files section with 15% rate
- No "~" prefix on any values -- server numbers are exact
- Validation messages also drop "~" prefix
- `ComplexityBadge` component: L1=muted, L2=amber, L3=orange
- `buildLanguageMap()` helper derives `scopeLanguages`/`contextLanguages` from server response for `CombinedClocResult` back-compat
- Complexity rates: L1=0.8, L2=1.0, L3=1.2

### Part D: Update `ScanContext.tsx`
Modify `src/contexts/ScanContext.tsx`:
- Add `orchestrationPhase` and `orchestrationProgress` state
- Add `OrchestrationProgress` interface (currentContract, contractIndex, contractTotal, subPhase)
- Add 3rd Realtime channel subscribing to `audit_orchestration` UPDATE events filtered by `session_id=eq.{currentAuditId}`
- Expose both new fields via context value
- Reset them in `startScan`, `cancelScan`, `closeWidget`
- Clean up the orchestration channel ref in `cleanupChannels`

### Part E: Update `ScanProgressWidget.tsx`
Modify `src/components/ScanProgressWidget.tsx`:
- Add `orchestrationPhase` and `orchestrationProgress` optional props
- Add `getPhaseLabel(phase, progress)` helper that maps phases to human labels:
  - `queued` -> "Queued -- waiting to start..."
  - `context_compression` -> "Compressing context..."
  - `hunting` -> "Hunting: {contract} -- {subPhase} ({i}/{n})"
  - `cross_contract` -> "Cross-contract analysis..."
  - `validation` -> "Validating findings..."
  - `qa` -> "QA: {contract} ({i}/{n})"
  - `formatting` -> "Enriching findings..."
  - default -> "Analyzing..."
- Replace static "Analyzing..." text in the header with `phaseLabel`

### Part F: Update `DashboardHome.tsx`
Modify `src/pages/dashboard/DashboardHome.tsx`:
- Destructure `orchestrationPhase` and `orchestrationProgress` from `useScan()`
- Pass them as props to `ScanProgressWidget`

## File Summary

| Action | File |
|--------|------|
| Migration | Enable Realtime on `audit_orchestration` |
| Create | `supabase/functions/web-estimate/index.ts` |
| Replace | `src/components/wizard/EstimatorStep.tsx` |
| Modify | `src/contexts/ScanContext.tsx` |
| Modify | `src/components/ScanProgressWidget.tsx` |
| Modify | `src/pages/dashboard/DashboardHome.tsx` |

