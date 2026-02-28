

# Update DashboardAuditDemo: Findings Data, Card UI, and Stop-on-Complete

## Overview
Three changes to `src/components/DashboardAuditDemo.tsx`:
1. Replace FINDINGS array with 16 new entries (2 critical, 2 high, 3 medium, 4 low, 5 gas)
2. Simplify finding cards to collapsed severity badge + truncated title only
3. Stop the animation after the audit completes instead of looping -- restart only on page revisit

## Changes (single file: `src/components/DashboardAuditDemo.tsx`)

### 1. Update DemoFinding type
Add `"low"` and `"gas"` to the severity union on line 8.

### 2. Replace FINDINGS array (lines 49-93)
Replace with the 16 new findings from the spec (2 critical, 2 high, 3 medium, 4 low, 5 gas).

### 3. Add SEVERITY_CONFIG entries for "low" and "gas"
- `low`: Info icon, "Low" label, blue-ish styling
- `gas`: Fuel icon, "Gas" label, green styling

### 4. Update FRAMES counts
All frames get a `gas` key. Progressive reveal:

| Frame | phaseIdx | findingsCount | c/h/m/l/i/g |
|-------|----------|---------------|-------------|
| 0     | 0        | 0             | 0/0/0/0/0/0 |
| 1     | 0        | 0             | 0/0/0/0/0/0 |
| 2     | 0        | 1             | 1/0/0/0/0/0 |
| 3     | 0        | 3             | 1/1/1/0/0/0 |
| 4     | 0        | 5             | 2/2/1/0/0/0 |
| 5     | 1        | 8             | 2/2/3/1/0/0 |
| 6     | 2        | 10            | 2/2/3/3/0/0 |
| 7     | 5        | 14            | 2/2/3/4/0/3 |
| 8     | 6        | 16 (complete) | 2/2/3/4/0/5 |

### 5. Stop animation on complete -- no looping
Change the frame advancement logic (line 173) from:
```typescript
setFrameIdx(f => (f >= FRAMES.length - 1 ? 0 : f + 1));
```
to:
```typescript
setFrameIdx(f => (f >= FRAMES.length - 1 ? f : f + 1));
```

This stops at the last frame. The demo only restarts when the user navigates away and comes back, because `useState(0)` re-initializes on mount.

### 6. Simplify finding card rendering
Remove from each finding card:
- File location line (FileCode icon + line numbers)
- Code snippet block (the `border-t bg-[hsl(0_0%_4%)]` pre block)

Each card becomes a single row:
```
[SEVERITY_BADGE]  Title text (truncated with line-clamp-1)
```

Rendered as a flex row with the severity pill on the left and the title (truncated) on the right, inside a compact `p-2.5 px-3` container.

