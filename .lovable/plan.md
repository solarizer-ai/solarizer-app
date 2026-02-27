
# UI Visual Consistency Pass -- Report and Public Report Pages

## Overview
This plan addresses 8 changes to fix visual inconsistencies: Low severity color, grade badge simplification, severity pill click-to-filter, Critical icon differentiation, finding row accents, remediation pill labels, and GradesPage content update. All changes are frontend-only.

---

## 1. Add `--low` CSS token to `src/index.css`
Insert `--low: 210 60% 55%` and `--low-foreground: 0 0% 100%` between `--warning-foreground` and `--critical` (after line 40).

## 2. Add `low` color to `tailwind.config.ts`
Add a `low` color entry (DEFAULT + foreground) between `warning` and `critical` in the colors section, enabling `text-low`, `bg-low/10`, `border-low/30`, etc.

## 3. Simplify `SecurityScoreCard.tsx`
- Remove `score` prop from the interface; add `onSeverityClick` prop
- Remove `displayScore`, `circumference`, `strokeDashoffset` calculations
- Replace the entire SVG ring + score text with a simple bordered circular grade badge (just the letter, no ring fill, no numeric score)
- Update `Low` category colors from `bg-primary/10` / `text-primary` to `bg-low/10` / `text-low`
- Tighten bar-to-pills gap (change `mb-4` to `mb-3`)
- Add `onSeverityClick` handler to each category pill div

## 4. Update `FindingItem.tsx`
- Import `ShieldAlert` from lucide-react
- Change `critical` icon from `AlertTriangle` to `ShieldAlert`
- Change `low` severity colors from `text-primary bg-primary/10 border-primary/20` to `text-low bg-low/10 border-low/20`
- Add a `leftBorderClass` map and apply `border-l-2 border-l-{severity-color}` to the outer wrapper div
- Adjust hover state transition on the header button (`hover:bg-muted/40 duration-150`)

## 5. Update `RemediationProgressWidget.tsx`
- Add severity label text inside each pill (capitalize the severity name before the fraction)
- Change progress bar height from `h-2` to `h-2.5`
- Update `low` severity config from `bg-primary` / `text-primary` to `bg-low` / `text-low`

## 6. Add `defaultSeverity` prop to `FindingsFilter.tsx`
- Add optional `defaultSeverity` prop to `FindingsFilterProps`
- Initialize `selectedSeverities` state from `defaultSeverity` if provided
- Add `useEffect` to update `selectedSeverities` when `defaultSeverity` changes externally

## 7. Wire severity filter in `Report.tsx`
- Add `severityFilter` state (`FindingSeverity | null`)
- Import `FindingSeverity` type from `@/hooks/useAudits`
- Remove `score` prop from `SecurityScoreCard` usage; add `onSeverityClick` that sets `severityFilter` and switches to findings tab
- Pass `defaultSeverity={severityFilter}` to `FindingsFilter`

## 8. Update `PublicReport.tsx` for consistency
- Update `low` entry in `severityConfig` from `text-primary bg-primary/10 border-primary/30` to `text-low bg-low/10 border-low/30` and `barColor` from `bg-primary` to `bg-low`
- Replace the SVG score ring with a simple grade badge (same style as SecurityScoreCard)
- Remove `score`, `circumference`, `strokeDashoffset` variables
- Add left border accent to finding rows (same pattern as FindingItem)

## 9. Rewrite `GradesPage.tsx`
Replace percentage-based grade descriptions with severity-based criteria:
- A: "No vulnerabilities" / "Only gas optimizations or informational findings"
- B: "Low severity only" / "Minor issues with no medium, high, or critical findings"
- C: "Medium severity found" / "At least one medium-severity vulnerability present"
- D: "High severity found" / "At least one high-severity vulnerability present"
- F: "Critical found" / "At least one critical vulnerability -- immediate action required"

Update subtitle from "How your security score maps to a grade" to "Grades are determined by the highest severity finding in your audit".

---

## Files Summary

| File | Action |
|------|--------|
| `src/index.css` | Edit (add --low token) |
| `tailwind.config.ts` | Edit (add low color) |
| `src/components/SecurityScoreCard.tsx` | Edit (grade badge, low color, onSeverityClick) |
| `src/components/FindingItem.tsx` | Edit (ShieldAlert, low color, left border) |
| `src/components/RemediationProgressWidget.tsx` | Edit (pill labels, low color, bar height) |
| `src/components/FindingsFilter.tsx` | Edit (defaultSeverity prop) |
| `src/pages/Report.tsx` | Edit (severity filter state, wire props) |
| `src/pages/PublicReport.tsx` | Edit (low color, grade badge, finding borders) |
| `src/pages/docs/GradesPage.tsx` | Edit (severity-based criteria) |
