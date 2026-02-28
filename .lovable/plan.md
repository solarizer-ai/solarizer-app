

# Fix DashboardAuditDemo: Full Width, Correct Grade, Clean Tab Labels

## Problems
1. The demo renders at a fixed 640px width inside a 1024px container, leaving it at roughly half width on desktop -- looks incomplete
2. The final grade shows "B+ Good" but with 2 critical findings it should be "F -- Critical Issues Found"
3. The Findings tab label shows "(16)" in brackets -- should be removed to match the real dashboard

## Changes (single file: `src/components/DashboardAuditDemo.tsx`)

### 1. Increase fixed render width from 640px to 1024px

Change `FIXED_W` from 640 to 1024 and `FIXED_H` from 520 to 640 to give the content more room and match the `max-w-5xl` container it sits in. This makes the demo fill the available width on desktop and scale proportionally on smaller screens.

```
FIXED_W = 1024
FIXED_H = 640
```

The inner content area height adjusts accordingly (from `h-[480px]` to `h-[600px]`).

### 2. Fix grade progression to end at F

Update FRAMES to reflect correct grading based on severity rules (Critical findings = F grade):

| Frame | Grade | Color | Score |
|-------|-------|-------|-------|
| 0-1   | --    | muted | 0     |
| 2     | F     | text-critical | 12 |
| 3     | F     | text-critical | 18 |
| 4     | F     | text-critical | 22 |
| 5     | F     | text-critical | 28 |
| 6     | F     | text-critical | 32 |
| 7     | F     | text-critical | 36 |
| 8 (complete) | F | text-critical | 38 |

The final scorecard will show: **F** -- **Critical** -- "Critical security flaws present"

Also update the grade border in the score card circle to use `border-critical` when grade is F.

### 3. Remove finding count from Findings tab

Remove the `count` property from the Findings tab definition and remove the rendering of the count badge. The tab label will just read "Findings" with no brackets.

Change line 378 from:
```
{ label: "Findings", icon: AlertTriangle, active: true, count: state.findingsCount },
```
to:
```
{ label: "Findings", icon: AlertTriangle, active: true },
```

And remove the count rendering block (lines 395-397).

### 4. Adjust internal layout for wider canvas

With 1024px width, the content has more breathing room:
- The score card and vulnerability matrix will spread naturally
- The findings list cards will show longer titles before truncating
- The phase stepper during progress will have proper spacing
- Tab bar items will be comfortably spaced

No structural changes needed -- the existing flex/grid layouts will fill the wider space naturally.

## Technical Summary

- `FIXED_W`: 640 -> 1024
- `FIXED_H`: 520 -> 640
- Inner content height: `h-[480px]` -> `h-[600px]`
- All 9 FRAMES: grade changed to "F" with `text-critical` color (from frame 2 onward)
- Findings tab: count display removed
- Score card grade circle: border uses `border-critical` for F grade
