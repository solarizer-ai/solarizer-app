

# Credit Calculation Fix + Live Audit Progress Panel

## Part 1: Fix Credit Calculation in cli-audit-start

**File:** `supabase/functions/cli-audit-start/index.ts` (lines 112-115)

Replace the flat 1:1 nLOC cost with per-contract complexity multipliers:
- L1 (simple): 0.8x
- L2 (moderate): 1.0x
- L3 (complex): 1.2x

Context files remain at 15% of their nLOC. This is a 4-line replacement.

---

## Part 2: Live Audit Progress on Report Page

### Step 1: Database -- Add RLS SELECT policy on audit_orchestration

Add a SELECT policy so authenticated users can read their own orchestration rows. INSERT/UPDATE/DELETE remain service-role only (no policies = denied).

```text
Policy: "Users can view own audit orchestration"
Table: audit_orchestration
Command: SELECT
Using: user_id = auth.uid()
```

### Step 2: Create useAuditProgress hook

**New file:** `src/hooks/useAuditProgress.ts`

- Queries `audit_orchestration` by `session_id` (= auditId)
- Polls every 2 seconds when `enabled` is true (active audit)
- Returns typed progress data: status, phase, progress JSONB, findings_count, error, timestamps

### Step 3: Create AuditProgressPanel component

**New file:** `src/components/AuditProgressPanel.tsx`

A card component showing live audit progress with three sections:

**Header**: "Audit in Progress" + elapsed timer (updates every second via setInterval)

**Phases section**: Shows all 8 pipeline phases in order with status indicators:
- Completed phases: green checkmark
- Active phase: spinning loader with contract counter for hunting/qa phases
- Pending phases: gray circle
- Hides cross_contract phase when only 1 contract

Phase labels: Complexity Analysis, Session Start, Hunting, Cross-Contract, Validation, QA Scan, Formatting, Report Generation

**Contracts section**: Built from progress.contractProgress and scope_metadata:
- Completed: green check + filename + complexity badge
- Active: expanded with sub-phases (DNA Matching, Initial Scan, Deep Scan for L2/L3)
- Pending: grayed out

**Findings section**: Shows total findings count from orchestration data. When past hunting phase, queries findings table for severity breakdown.

Uses existing design tokens (text-success, text-primary, text-muted-foreground, text-critical, text-warning).

### Step 4: Integrate into Report page

**Modified file:** `src/pages/Report.tsx`

Changes:
1. Import `useAuditProgress` and `AuditProgressPanel`
2. Call `useAuditProgress(auditId, isLive)` after existing hooks
3. Update the "Analysing..." text (line 273-276) to show current phase name when available
4. Insert `AuditProgressPanel` above the SecurityScoreCard when `isLive && orchestration` exists; hide SecurityScoreCard during analysis
5. Add `useEffect` to invalidate audit + findings queries when orchestration status becomes `completed`, enabling automatic transition to the final report view

### Step 5 (Optional): AuditCard phase display

**Modified file:** `src/components/AuditCard.tsx`

Add optional `phase` prop to show current phase label under "Analyzing" status on dashboard cards.

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/cli-audit-start/index.ts` | Modify lines 112-115 (credit calc) |
| Migration SQL | Add SELECT RLS policy on `audit_orchestration` |
| `src/hooks/useAuditProgress.ts` | Create |
| `src/components/AuditProgressPanel.tsx` | Create |
| `src/pages/Report.tsx` | Modify (add progress panel integration) |
| `src/components/AuditCard.tsx` | Modify (optional phase prop) |

No new secrets or environment variables needed.

