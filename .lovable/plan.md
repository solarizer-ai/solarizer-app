

# Fix Contract Sub-Phases Marked Done Prematurely

## Problem

Line 122 in `AuditProgressPanel.tsx`:
```
const done = prog?.done || idx < effectiveIdx || activePhaseIdx > 1;
```

The `> 1` was hardcoded when hunting was at PHASES index 1. After adding "invariants" at index 1, hunting moved to index 2. So when `activePhaseIdx` becomes 2 (hunting), the condition `> 1` is true and all contracts are incorrectly marked as done.

## Fix

Replace the hardcoded `1` with a dynamic lookup of the hunting phase index:

```typescript
const huntingPhaseIdx = getPhaseIndex("hunting");
```

Then change the done condition to:
```typescript
const done = prog?.done || idx < effectiveIdx || activePhaseIdx > huntingPhaseIdx;
```

This ensures contracts are only marked done when the audit has moved **past** the hunting phase, regardless of where hunting sits in the PHASES array.

## File Changed

**`src/components/AuditProgressPanel.tsx`** — one line change on line 122.

