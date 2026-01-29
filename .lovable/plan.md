
# Remove Cancel Analysis Feature

## Overview
Simplify the "Analysis in Progress" modal to only display a passive message that contracts are being analyzed. Remove all cancellation functionality from the modal and related components.

---

## Changes Summary

### 1. Simplify `AnalysisInProgressModal.tsx`

**Remove:**
- Cancel button and its handler (`handleCancelOtherAudit`)
- Cancel warning message with `AlertTriangle` icon
- `handleCancelCurrentSession` function
- Dependencies: `useUpdateAudit`, `useQueryClient`, `useScan`, `toast`
- Unused imports: `X`, `AlertTriangle`
- Props: `currentSessionAuditId` and `onCancel` (no longer needed)

**Keep:**
- List of active analyses with project names and severity badges
- Loading state
- Empty state when no analyses running
- Close button

**New UI per project card:**
```
+----------------------------------------------+
| [Spinner] "Project Alpha"                    |
| Critical: 2  High: 5  Medium: 8  Low: 3      |
+----------------------------------------------+
```

### 2. Update `Index.tsx`

**Remove from modal props:**
- `currentSessionAuditId` prop
- `onCancel` prop

**After:**
```tsx
<AnalysisInProgressModal
  open={showAnalysisModal}
  onOpenChange={setShowAnalysisModal}
/>
```

### 3. Keep `cancelScan` in ScanContext (Optional cleanup)

The `cancelScan` function in `ScanContext.tsx` can remain for now in case it's used elsewhere, but it will no longer be called from the modal.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AnalysisInProgressModal.tsx` | Remove cancel button, handlers, and related imports. Simplify props interface. |
| `src/pages/Index.tsx` | Remove `currentSessionAuditId` and `onCancel` props from modal |

---

## Final Modal Structure

```text
+--------------------------------------------------+
|  Analyses in Progress                         [X] |
+--------------------------------------------------+
|  Please wait for current analyses to complete.   |
+--------------------------------------------------+
|                                                  |
|  +----------------------------------------------+|
|  | [Spinner] "Project Alpha"                    ||
|  | Critical: 2  High: 5  Medium: 8  Low: 3      ||
|  +----------------------------------------------+|
|                                                  |
|  +----------------------------------------------+|
|  | [Spinner] "Project Beta"                     ||
|  | Scanning for vulnerabilities...              ||
|  +----------------------------------------------+|
|                                                  |
+--------------------------------------------------+
|                                        [ Close ] |
+--------------------------------------------------+
```

No cancel buttons, no credit warnings - just a clean display of what's currently being analyzed.
