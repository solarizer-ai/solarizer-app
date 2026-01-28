
# Fix Remediation Progress Widget - Font & Severity Display

## Current Issues

1. **Font Inconsistency**: Using `font-mono` for X/Y counts while rest of page uses Inter
2. **Awkward Severity Labels**: Showing truncated names like "crit", "high", "medi" - confusing and inconsistent
3. **Verbose Layout**: Takes up too much space with separate rows for name, count, and percentage

## Solution

Replace the current grid of severity boxes with compact, color-coded pills showing just the X/Y resolved count. This matches the visual style of SecurityScoreCard's vulnerability matrix pills.

### Current Layout
```
┌─────┐ ┌─────┐ ┌─────┐
│crit │ │high │ │medi │
│ 0/2 │ │ 1/3 │ │ 2/5 │
│ 0%  │ │ 33% │ │ 40% │
└─────┘ └─────┘ └─────┘
```

### New Layout
```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ ● 0/2  │ │ ● 1/3  │ │ ● 2/5  │ │ ● 3/4  │ │ ● 1/1  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
 (critical)  (high)    (medium)    (low)     (info)
   purple     red       yellow     orange    gray
```

- Each pill shows a colored dot + resolved/total count
- Colors match the existing severity color scheme throughout the app
- No text labels - severity is communicated via color
- Compact, mobile-friendly horizontal layout

---

## Technical Changes

### File: `src/components/RemediationProgressWidget.tsx`

1. **Remove `font-mono`** from the X/Y count display
2. **Replace severity grid** with colored pill badges:
   - Use `bg-{severity}/10` background with `border-{severity}/30` border
   - Show colored dot indicator + X/Y count
   - Remove percentage display (already shown in overall progress)
   - Remove truncated severity names
3. **Update color configuration** to include background and border colors matching SecurityScoreCard
4. **Use flex-wrap layout** for better mobile responsiveness

### Color Scheme (matching existing design tokens)
| Severity | Dot Color | Background | Border |
|----------|-----------|------------|--------|
| Critical | `bg-critical` | `bg-critical/10` | `border-critical/30` |
| High | `bg-destructive` | `bg-destructive/10` | `border-destructive/30` |
| Medium | `bg-warning` | `bg-warning/10` | `border-warning/30` |
| Low | `bg-primary` | `bg-primary/10` | `border-primary/30` |
| Info | `bg-slate-400` | `bg-slate-400/10` | `border-slate-400/30` |

---

## Code Structure

```tsx
const severityConfig = {
  critical: {
    dot: "bg-critical",
    bg: "bg-critical/10",
    border: "border-critical/30",
    text: "text-critical",
  },
  high: {
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
  },
  // ... medium, low, info
};

// Render pills
<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
  {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => {
    const severityStats = stats.bySeverity[severity];
    if (severityStats.total === 0) return null;
    const config = severityConfig[severity];
    
    return (
      <div
        key={severity}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
          config.bg,
          config.border
        )}
      >
        <span className={cn("w-2 h-2 rounded-full", config.dot)} />
        <span className={cn("text-sm font-medium", config.text)}>
          {severityStats.resolved}/{severityStats.total}
        </span>
      </div>
    );
  })}
</div>
```

---

## Visual Result

**Desktop/Mobile:**
```
Remediation Progress
────────────────────────────────────
Overall                    8/15 resolved (53%)
[===========--------]

[● 0/2] [● 1/3] [● 2/5] [● 4/4] [● 1/1]
 purple   red    yellow  orange  gray

⚠ 2 critical and 2 high severity findings remaining
```

The colored dots and X/Y numbers immediately communicate:
- Which severities have findings
- Progress for each severity
- No need for labels - color tells the story

---

## Summary

| Change | Before | After |
|--------|--------|-------|
| Font | `font-mono` | Regular Inter font |
| Layout | 3-row boxes with labels | Single-row color pills |
| Content | Name + X/Y + % | Just colored X/Y |
| Responsiveness | Grid with wrapping | Flex-wrap pills |
