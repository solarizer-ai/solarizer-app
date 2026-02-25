

# Fix: Auto-transition UI when audit is cancelled or failed

## Problem
In `Report.tsx`, the effect that invalidates queries when orchestration completes only checks for `'completed'` status. When an audit is cancelled (or fails), the orchestration status changes to `'cancelled'`/`'failed'`, but the UI never picks up the change — so the progress panel stays stuck showing "queued".

## Fix

### `src/pages/Report.tsx` (lines 198-203)
Expand the auto-transition effect to also trigger on `cancelled` and `failed` orchestration statuses:

```typescript
useEffect(() => {
  if (
    orchestration?.status === 'completed' ||
    orchestration?.status === 'cancelled' ||
    orchestration?.status === 'failed'
  ) {
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    queryClient.invalidateQueries({ queryKey: ['findings', auditId] });
  }
}, [orchestration?.status, auditId, queryClient]);
```

Once the `audits` row is re-fetched with `status = 'cancelled'`, `isLive` becomes `false`, the progress panel disappears, and the existing cancelled/failed UI (lines 306-333) takes over — showing the "Analysis Cancelled" message with the refund notice.

## Files Modified
| File | Change |
|------|--------|
| `src/pages/Report.tsx` | Expand orchestration status check to include `cancelled` and `failed` |
