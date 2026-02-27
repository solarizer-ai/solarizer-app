

# Update DashboardAuditDemo to Match Real Report UI (Updated Plan)

## Overview
Rewrite `src/components/DashboardAuditDemo.tsx` to match the real `AuditProgressPanel` and `SecurityScoreCard` components. Fixed-height container, no layout growth from findings.

## Edge Case Verifications (requested)

1. **phaseIdx: 6 on complete frame** -- Correct. With 6 phases (indices 0-5), `phaseIdx > idx` is true for all, so all render as done.

2. **FRAMES phaseIdx remapping** -- Current values `[0, 2, 2, 2, 2, 3, 4, 7, 8]` become `[0, 0, 0, 0, 0, 1, 2, 5, 6]` after removing the first 2 phases.
   - Contract "isDone" check (line 321): `state.phaseIdx > 2` must change to `state.phaseIdx > 0` (Hunting is now index 0).
   - Contract "isActive" check (line 322): `state.phaseIdx === 2` must change to `state.phaseIdx === 0`.
   - Hunting suffix (line 297): Uses `phase === "Hunting"` string match -- still works regardless of index. Confirmed correct.

3. **Fixed-height + findings scroll** -- The outer wrapper must be `flex flex-col` with a fixed height (`h-[480px] sm:h-[520px]`). The findings area uses `overflow-y-auto flex-1 min-h-0` inside it so scrolling stays within bounds.

4. **GRADE_DESCRIPTIONS for "B+"** -- The demo uses "B+" as a grade string (not just "B"). Both `GRADE_LABELS` and `GRADE_DESCRIPTIONS` must include entries for "B+" and "C+" in addition to plain letter grades. Confirmed: all maps will include: `A`, `B+`, `B`, `C+`, `C`, `D`, `F`, and the pending value.

## All Changes (single file: `src/components/DashboardAuditDemo.tsx`)

### Constants / Data

| # | What | Detail |
|---|------|--------|
| 1 | PHASES | Remove "Complexity Analysis" and "Session Start". Keep 6: Hunting, Cross-Contract, Validation, QA Scan, Formatting, Report Generation |
| 2 | FRAMES phaseIdx | Remap: `[0,2,2,2,2,3,4,7,8]` to `[0,0,0,0,0,1,2,5,6]`. Add `gas: 0` to all counts |
| 3 | VULN_CATEGORIES | Add Gas entry (`bg-green-500`). Use full labels. Add icon field per entry |
| 4 | New maps | `GRADE_LABELS` (A=Excellent, B+=Good, B=Good, C+=Fair, C=Fair, D=Poor, F=Critical), `GRADE_DESCRIPTIONS` (with B+ and C+ entries), `COMPLEXITY_STYLES` (L1/L2/L3 color maps) |
| 5 | Import | Add `Fuel` from lucide-react |

### Layout

| # | What | Detail |
|---|------|--------|
| 6 | Fixed container | Inner content area: `flex flex-col h-[480px] sm:h-[520px] overflow-hidden` |
| 7 | Conditional layout | `!complete`: full-width progress panel only, hide score card. `complete`: full-width score card only, hide progress panel |

### Progress Panel

| # | What | Detail |
|---|------|--------|
| 8 | Text sizes | Phase/contract rows: `text-sm`. Header: `text-sm`. Sub-phases: `text-xs` |
| 9 | Active highlight | Active phase row: `bg-primary/5 rounded px-2 -mx-2` |
| 10 | Complexity pills | Replace Badge with colored pill using COMPLEXITY_STYLES map |
| 11 | Sub-phase tree | Change `ml-5 space-y-px` to `ml-6 pl-3 border-l-2 border-border/40 space-y-0.5` |
| 12 | Contract logic | isDone: `phaseIdx > 0` (was `> 2`). isActive: `phaseIdx === 0` (was `=== 2`) |

### Score Card

| # | What | Detail |
|---|------|--------|
| 13 | Grade circle | Replace SVG donut with `w-12 h-12 rounded-full border-2` div, letter only, no numeric score |
| 14 | Rating label | Use `GRADE_LABELS[state.grade]` lookup (fixes double "Good" bug) |
| 15 | Description | Add `GRADE_DESCRIPTIONS[state.grade]` below rating label |
| 16 | Bar height | `h-2` to `h-2.5` |
| 17 | Vuln pills | `grid grid-cols-3 gap-2 sm:flex sm:flex-wrap`, with icon, count, full/abbreviated label |
| 18 | Gas category | Add to pills and bar |

### Findings Area

| # | What | Detail |
|---|------|--------|
| 19 | Scroll containment | Findings list wrapper: `overflow-y-auto flex-1 min-h-0` inside the flex-col container |

