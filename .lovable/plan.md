

# Add Invariants, Coverage, and Insights Tabs

## Overview
Add three new tabs (Invariants, Coverage, Insights) to the Report page and extend the `cli-audit-complete` edge function to persist `coverage_data` and `system_hologram` metadata from the proxy.

## Changes

### 1. Extend `cli-audit-complete` edge function
**File:** `supabase/functions/cli-audit-complete/index.ts`

- Add `CoverageTestDetail` and `CoverageData` interfaces
- Add `coverage_data?: CoverageData` and `system_hologram?: Record<string, unknown>` to `CompleteRequest`
- After step 4 (finalize audit status), add metadata merge logic:
  - For `coverage_data`: fetch existing, merge by `file::test_name` key, recompute totals
  - For `system_hologram`: shallow-merge with existing hologram
  - Write merged data back to `audits` row
- Deploy the updated function

### 2. Add types to `useAudits.ts`
**File:** `src/hooks/useAudits.ts`

Add two new exported interfaces:
```text
Invariant { description, scope ('contract'|'cross-contract'), contracts: string[], severity_if_broken ('CRITICAL'|'HIGH') }
ArchitectureInsight { category ('weak_point'|'feature_suggestion'|'architecture_improvement'), title, description, priority ('high'|'medium'|'low'), affected_contracts?: string[] }
```

### 3. Create `InvariantsTab` component
**File:** `src/components/InvariantsTab.tsx` (new)

- Props: `invariants: Invariant[] | null`
- Summary badge showing total count and contract vs cross-contract breakdown
- Two collapsible sections: "Contract Invariants" and "Cross-Contract Invariants"
- Each invariant as a card with description, severity badge (CRITICAL=red, HIGH=orange), and affected contracts as monospace chips
- Empty state with Shield icon

### 4. Create `InsightsTab` component
**File:** `src/components/InsightsTab.tsx` (new)

- Props: `insights: ArchitectureInsight[] | null`
- Three collapsible sections (only shown if they have items):
  - Weak Points (AlertTriangle icon, category `weak_point`)
  - Feature Suggestions (Lightbulb icon, category `feature_suggestion`)
  - Architecture Improvements (Layers icon, category `architecture_improvement`)
- Each insight as a card with bold title, priority badge (high=red, medium=amber, low=green), description, and affected contracts as monospace chips
- Empty state with Lightbulb icon

### 5. Update `Report.tsx`
**File:** `src/pages/Report.tsx`

- Import `InvariantsTab`, `InsightsTab`, and new icons (`Lightbulb`, `ShieldCheck`)
- Import `Invariant`, `ArchitectureInsight` types
- Change `TabsList` from `grid grid-cols-3` to `flex w-full overflow-x-auto` for 6 tabs
- Add three new `TabsTrigger` entries after "Archive": Invariants (Shield icon), Coverage (ShieldCheck icon), Insights (Lightbulb icon)
- Add three new `TabsContent` sections:
  - `invariants`: renders `InvariantsTab` with data from `currentAudit?.system_hologram?.invariants`
  - `coverage`: renders existing `SecurityCoverageTab` with `currentAudit?.coverage_data`
  - `insights`: renders `InsightsTab` with data from `currentAudit?.system_hologram?.insights`
- No changes to `ScopeTab` -- it doesn't render coverage, just scope/file tree

### Technical notes
- No database migration needed -- `coverage_data` (jsonb) and `system_hologram` (jsonb) columns already exist on the `audits` table
- The edge function deploy happens automatically after editing
- All new components use existing UI primitives (`Collapsible`, `Badge`, `cn()`) and semantic color tokens for dark mode compatibility
