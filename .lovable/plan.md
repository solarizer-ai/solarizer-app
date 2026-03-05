

# Add Invariants, Insights & Coverage Tabs to Public Report

## Current State

The public report page (`PublicReport.tsx`) renders findings in a flat list grouped by severity, with a static scope section. It has no tabbed interface and no Invariants, Insights, or Coverage views.

The private Report page already uses `InvariantsTab`, `InsightsTab`, and `SecurityCoverageTab` components with data from `audit.system_hologram` (JSONB) and `audit.coverage_data`. The public audit query (`usePublicAudit`) already fetches `*` from the audits table, so `system_hologram` and `coverage_data` are available.

## Changes

**`src/pages/PublicReport.tsx`**

1. Add imports for `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `InvariantsTab`, `InsightsTab`, `SecurityCoverageTab`, and the `Shield` icon (already imported).

2. Replace the current flat layout (Scope section + Detailed Findings + No Findings state) with a tabbed interface containing:
   - **Findings** tab (default) — the existing grouped findings list
   - **Invariants** tab — renders `<InvariantsTab>` with data from `audit.system_hologram.invariants`
   - **Insights** tab — renders `<InsightsTab>` with data from `audit.system_hologram.insights`
   - **Coverage** tab — renders `<SecurityCoverageTab>` with `audit.coverage_data`
   - **Scope** tab — the existing scope files section (moved into a tab)

3. Add a `useState` for active tab, defaulting to `"findings"`.

4. The tab bar styling will match the private report: equally spaced triggers with icons.

No database or hook changes needed — the data is already fetched.

