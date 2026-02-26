

# Homepage Redesign: Report-Accurate Dashboard Mockup

## Overview
Redesign the homepage per the spec, but replace the generic "DashboardAuditDemo" with a component that visually replicates the **actual Report page** layout -- SecurityScoreCard with circular grade, vulnerability matrix bar, AuditProgressPanel phase stepper with contract sub-phases, tab bar, and finding items.

## Changes

### 1. Create `src/components/DashboardAuditDemo.tsx` (NEW)

A miniature animated replica of the real Report page (`src/pages/Report.tsx`), including:

**Header area** (mirrors Report page header):
- Project name "VaultProtocol" with back arrow and elapsed timer
- Subtitle: "4 contracts . 2,847 nLOC"

**SecurityScoreCard replica** (mirrors `SecurityScoreCard.tsx`):
- SVG circular progress ring with grade letter (animates from "--" through C+, B, B+)
- Score label (e.g. "74/100") and rating text ("Good", "Fair", etc.)
- Vulnerability matrix bar (colored segments: red/orange/yellow/blue/slate)
- Category pills below the bar (Crit/High/Med/Low/Info counts)

**AuditProgressPanel replica** (mirrors `AuditProgressPanel.tsx`):
- "Phases" section: 8-phase vertical list with checkmark/spinner/circle icons
  - Complexity Analysis, Session Start, Hunting (2/4), Cross-Contract, Validation, QA Scan, Formatting, Report Generation
- "Contracts" section: per-contract rows with complexity badges (L1/L2/L3)
  - Active contract shows sub-phases: DNA Matching, Initial Scan, Deep Scan
  - Completed contracts show green checkmarks

**Tab bar** (mirrors Report page tabs):
- 6 tabs: Scope, Insights, Invariants, Findings (4), Coverage, Archive
- "Findings" tab shown as active

**Findings preview** (mirrors FindingItem cards):
- 2-3 finding cards with severity badge, title, file location, and a code snippet block
- Styled identically to the real FindingItem component

**Animation sequence** (9 frames, auto-restart):
1. Empty state -- phases all pending, no score
2. Complexity Analysis completes, Hunting starts
3. First finding appears (CRITICAL), score jumps to 28
4. Second finding (HIGH), score to 44, contract sub-phase advances
5. Third finding (HIGH), score to 61
6. Fourth finding (MEDIUM), score to 67, Hunting completes
7. Validation phase active, score to 71
8. Reporting phase, score to 74
9. Complete state -- all phases checked, "Audit complete" banner, hold 5s then restart

The component uses the same Tailwind classes and color tokens as the real components (e.g. `text-success`, `text-critical`, `stroke-success`, `bg-warning/10`, `border-primary/20`).

### 2. Replace `src/pages/Home.tsx` (FULL REPLACEMENT)

Same 7-section structure from the spec:
1. **Hero**: "Enterprise-Grade Security / Accessible To All", dual CTAs, trust line, `DashboardAuditDemo` below
2. **Paradigm Shift**: Pull quote, editorial paragraphs, 3 stats
3. **Comparison**: Traditional Audit vs Solarizer (6 rows)
4. **Findings**: Same 3 known + 2 protocol-specific cards (unchanged content)
5. **Intelligence Engine**: Sanitized phase names (Smart Scoping, Pattern Intelligence, Vulnerability Hunting, Protocol-Wide Reasoning, Structured Reporting), scroll animation
6. **Built For Enterprise**: 4 feature cards with CSS illustrations
7. **CTA**: "Enterprise Security / Without The Enterprise Price Tag"

No `TerminalAuditDemo` import. No `npm install` command. No CLI-first copy.

### 3. Update `src/components/Header.tsx` (TWO TEXT CHANGES)

- Line 106: `Get Started` --> `Start Auditing`
- Line 161: `Get Started` --> `Start Auditing`

No other changes to Header.

## DashboardAuditDemo Technical Details

The mockup replicates these specific visual elements from the real codebase:

| Real Component | Mockup Element |
|---|---|
| `SecurityScoreCard` circular SVG (r=45, strokeWidth=6, -rotate-90) | Identical SVG with animated strokeDashoffset |
| `SecurityScoreCard` vulnerability matrix bar (h-2.5, rounded-full) | Same bar with animated segment widths |
| `SecurityScoreCard` category pills (grid + flex, colored borders) | Same pill layout with animated counts |
| `AuditProgressPanel` phase list (CheckCircle2/Loader2/Circle icons) | Same icon progression per frame |
| `AuditProgressPanel` contract rows with L1/L2/L3 badges | Same layout with sub-phase nesting |
| `AuditProgressPanel` sub-phases (DNA Matching, Initial Scan, Deep Scan) | Shown for active contract |
| Report page tab bar (TabsList with 6 triggers, justify-evenly) | Static tab bar, "Findings" active |
| FindingItem severity badges + code blocks | 2-3 static finding cards |

Frame timing: 1.6s-5s per frame (same delays as spec). macOS-style title bar retained. `min-h` on findings area prevents layout shift.

## File Summary

| Action | File |
|--------|------|
| Create | `src/components/DashboardAuditDemo.tsx` |
| Replace | `src/pages/Home.tsx` |
| Modify | `src/components/Header.tsx` (2 text changes) |

