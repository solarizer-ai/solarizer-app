
# EstimatorStep Table Layout + AuditProgressPanel Improvements

## Part 1: EstimatorStep Table Layout

**File: `src/components/wizard/EstimatorStep.tsx`**

### 1.1 Update ComplexityBadge styling
Replace solid amber/orange badges with pill-shaped ring badges:
- L1: gray with ring border
- L2: blue tint with blue ring
- L3: amber tint with amber ring

### 1.2 Replace success-state card layout with HTML table
Replace the stacked card rows (lines 160-238) with a proper `<table>` layout:
- Column headers: File | Complexity | nLOC | Credits
- Scope files section with labeled header row spanning all columns
- Context files section (conditional) with labeled header row
- `<tfoot>` with total credits row using `border-t-2` separator (no background tint)
- Per-file credits in `text-foreground` (not orange); only total in `text-primary`
- `tabular-nums` on numeric columns for consistent alignment
- Complexity column hidden on mobile (`hidden sm:table-cell`)
- Hover effect `hover:bg-muted/30` on file rows
- Reasoning available via `title` attribute (native tooltip on hover)

### 1.3 Update validation banner
Change from full solid background to left-border accent style:
- `border-l-4` with green or amber border
- Lighter `bg-*/5` tint background

---

## Part 2: AuditProgressPanel Improvements

**File: `src/components/AuditProgressPanel.tsx`**

### 2.1 Add `liveFindings` prop
Add optional `liveFindings?: { severity: string }[]` prop to the component interface.

### 2.2 Scope summary below title
Compute and display "N contracts . X nLOC" summary line below the "Audit in Progress" title when `scopeMetadata` is available.

### 2.3 Active phase row highlight
Add `bg-primary/5 rounded` background to the currently active phase row.

### 2.4 Pill-style complexity badges on contracts
Replace `<Badge variant="outline">` with the same pill-style badges used in EstimatorStep (L1 gray, L2 blue, L3 amber). Remove unused `Badge` import.

### 2.5 Mutually exclusive contract icons
Fix overlapping icons by using if/else priority: error > done > active > pending. Currently `done` and `error` can both render simultaneously.

### 2.6 Sub-phase tree connector line
Add `border-l-2 border-border/40` to the sub-phase container to create a vertical connecting line (mimicking CLI tree structure).

### 2.7 Show sub-phases only during hunting/qa
Wrap sub-phase expansion in a condition: only show when `orchestration.phase === 'hunting' || orchestration.phase === 'qa'`.

### 2.8 Findings severity breakdown
Replace the empty "Findings (N)" header with severity pill badges showing counts per severity level (critical, high, medium, low, info, gas) with color-coded styles.

### 2.9 Fix hunting/QA counter to 1-based
Change `contractIndex` display to `contractIndex + 1` so users see "(1/3)" instead of "(0/3)".

---

## Part 3: Wire liveFindings in Report.tsx

**File: `src/pages/Report.tsx`**

### 3.1 Pass `liveFindings` to AuditProgressPanel
Add `liveFindings={visibleFindings}` prop to the existing `<AuditProgressPanel>` usage (line 420-423).

---

## Summary of files changed

| File | Changes |
|---|---|
| `src/components/wizard/EstimatorStep.tsx` | Table layout, pill badges, validation banner |
| `src/components/AuditProgressPanel.tsx` | Scope summary, pill badges, tree lines, findings breakdown, icon fixes, phase highlight, 1-based counters |
| `src/pages/Report.tsx` | Pass `liveFindings` prop |
