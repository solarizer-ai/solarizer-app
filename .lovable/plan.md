
# Fix: Modal Showing After All Analyses Cancelled

## Problem
When all analyses are cancelled, clicking "Run Analysis" still shows the "Analyses in Progress" modal (displaying "No analyses in progress") instead of navigating to the wizard. This blocks users from starting new analyses.

## Root Cause
There are two separate data sources checking for active analyses:
1. `Index.tsx` uses `useAudits()` to compute `hasActiveAnalysis`
2. `AnalysisInProgressModal` uses `useActiveAnalyses()` to display the list

When an audit is cancelled via the modal, only the `active-analyses` query gets invalidated. The main `audits` query remains stale, causing `hasActiveAnalysis` to incorrectly remain `true`.

## Solution
Ensure proper query invalidation when cancelling audits, so both queries are synchronized:

### Changes

**File: `src/components/AnalysisInProgressModal.tsx`**
1. Import `useQueryClient` from `@tanstack/react-query`
2. After successfully cancelling an audit, invalidate both queries:
   - `['active-analyses']` - for the modal's data
   - `['audits']` - for the `Index.tsx` gate check

```typescript
const queryClient = useQueryClient();

const handleCancelOtherAudit = async (auditId: string) => {
  try {
    await updateAudit.mutateAsync({
      id: auditId,
      status: "cancelled" as AuditStatus,
      is_locked: true,
    });
    
    // Invalidate both queries to ensure consistent state
    queryClient.invalidateQueries({ queryKey: ['audits'] });
    queryClient.invalidateQueries({ queryKey: ['active-analyses'] });
    
    toast.info("Analysis cancelled", {
      description: "Note: Credits used for this analysis have already been consumed.",
    });
  } catch (e) {
    toast.error("Failed to cancel analysis");
  }
};
```

**File: `src/contexts/ScanContext.tsx`**
3. Similarly, ensure the `cancelScan` function invalidates the `audits` query after cancelling

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/AnalysisInProgressModal.tsx` | Add query invalidation after cancel |
| `src/contexts/ScanContext.tsx` | Ensure `audits` query invalidation in `cancelScan` |

---

## Expected Behavior After Fix
1. User cancels all active analyses
2. Both `audits` and `active-analyses` queries are invalidated
3. `hasActiveAnalysis` returns `false` since no audits have `pending`/`analyzing` status
4. Clicking "Run Analysis" correctly navigates to the wizard
