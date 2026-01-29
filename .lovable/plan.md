

# Show All Active Analyses with Finding Counts by Severity

## Overview
Redesign the Analysis in Progress modal to display **all** projects currently being analyzed, with a compact view showing the count of findings grouped by severity for each project.

---

## Current State
- `ScanContext` tracks only one active scan (single project)
- Modal shows individual findings in a scrollable list
- Only the current session's scan is displayed

## Target State
- Modal shows all audits with status `'pending'` or `'analyzing'`
- Each project displays aggregated finding counts by severity (Critical: X, High: Y, etc.)
- Cancel button only available for the current session's scan (tracked by ScanContext)

---

## Implementation

### 1. Create a Hook to Fetch Active Analyses with Finding Counts

**New File:** `src/hooks/useActiveAnalyses.ts`

Query all audits in `pending`/`analyzing` status, then fetch their finding counts grouped by severity.

```typescript
interface ActiveAnalysis {
  id: string;
  project_name: string;
  status: 'pending' | 'analyzing';
  created_at: string;
  findingCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}
```

Uses two queries:
1. Fetch audits where status is `pending` or `analyzing`
2. Fetch findings for those audits and aggregate by severity

### 2. Update AnalysisInProgressModal

**Changes to props:**
```typescript
interface AnalysisInProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Remove single project props, fetch internally
  currentSessionAuditId: string | null; // For cancel button visibility
  onCancel: () => void;
}
```

**New UI Structure:**
- Fetch active analyses inside the modal using the new hook
- Display each project as a card showing:
  - Project name with spinner
  - Severity count badges in a row (Critical: 2, High: 5, etc.)
  - Cancel button only if `audit.id === currentSessionAuditId`
- If no active analyses, show "No analyses in progress" message

### 3. Update Index.tsx

Remove individual project props passed to the modal:
```typescript
<AnalysisInProgressModal
  open={showAnalysisModal}
  onOpenChange={setShowAnalysisModal}
  currentSessionAuditId={isScanning ? currentAuditId : null}
  onCancel={cancelScan}
/>
```

---

## Visual Design

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
|  | [Cancel Analysis]                            ||
|  | ⚠️ Cancelling will not refund credits         ||
|  +----------------------------------------------+|
|                                                  |
|  +----------------------------------------------+|
|  | [Spinner] "Project Beta"                     ||
|  | Critical: 0  High: 2  Medium: 1  Low: 0      ||
|  | (No cancel - different session)              ||
|  +----------------------------------------------+|
|                                                  |
+--------------------------------------------------+
|                                        [ Close ] |
+--------------------------------------------------+
```

### Severity Badge Layout
Compact horizontal row with colored badges:
- Critical (red): count
- High (orange): count  
- Medium (yellow): count
- Low (blue): count
- Info (gray): count (optional, may hide if 0)

---

## Files to Create/Modify

| File | Action | Details |
|------|--------|---------|
| `src/hooks/useActiveAnalyses.ts` | Create | Hook to fetch all active audits with finding severity counts |
| `src/components/AnalysisInProgressModal.tsx` | Modify | Display multiple projects with aggregated severity counts |
| `src/pages/Index.tsx` | Modify | Update modal props to pass current session audit ID |

---

## Technical Details

### Finding Count Query
```sql
-- Conceptual query for severity aggregation
SELECT 
  audit_id,
  severity,
  COUNT(*) as count
FROM findings
WHERE audit_id IN (active_audit_ids)
GROUP BY audit_id, severity
```

### Real-time Updates
- The hook uses the existing `audits` query which already refreshes
- Finding counts can poll or invalidate on the same interval
- For real-time finding stream, the modal can still subscribe to the ScanContext's `realtimeFindings` for the current session's audit and merge counts

### Empty State
When no analyses are in progress:
```text
+--------------------------------------------------+
|  Analyses in Progress                         [X] |
+--------------------------------------------------+
|                                                  |
|      No analyses are currently running.          |
|      Click "Run Analysis" to start one.          |
|                                                  |
+--------------------------------------------------+
|                                        [ Close ] |
+--------------------------------------------------+
```

