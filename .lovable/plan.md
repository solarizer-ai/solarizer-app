

# Analysis in Progress Modal with Live Findings

## Overview
Replace the current inline "Analysis in Progress" message with a modal (popup) that appears when users click "New Analysis" while an analysis is already running. The modal will display the current analysis details, real-time findings as they stream in, and a cancel button with credit warning.

---

## User Experience Flow

1. User has an analysis running
2. User clicks "Run Analysis" button
3. Instead of navigating to the wizard, a modal pops up showing:
   - Current project name being analyzed
   - Animated spinner with status
   - Live list of findings discovered (streaming in real-time)
   - Cancel button with credit warning
4. User can close the modal to return to dashboard
5. When analysis completes, modal can be dismissed

---

## Implementation

### 1. Create New Modal Component

**File:** `src/components/AnalysisInProgressModal.tsx`

A new modal component that displays:

```tsx
interface AnalysisInProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  findings: Finding[];
  isScanning: boolean;
  onCancel: () => void;
}
```

**UI Structure:**
- Dialog with max-width of ~lg (larger to accommodate findings list)
- Header: "Analysis in Progress" title
- Project name display with spinner icon
- Scrollable findings list (max-height with scroll)
  - Each finding shows severity badge + title (compact display)
  - "No findings discovered yet" placeholder when empty
  - Counter showing "X findings discovered"
- Footer:
  - Cancel button with amber warning text
  - Close button (just closes modal, doesn't cancel)

### 2. Modify Index.tsx

**Changes:**

1. Add state for the modal:
   ```tsx
   const [showAnalysisModal, setShowAnalysisModal] = useState(false);
   ```

2. Update `handleNewAudit` function:
   ```tsx
   const handleNewAudit = () => {
     // If analysis is in progress, show modal instead of wizard
     if (analysisInProgress) {
       setShowAnalysisModal(true);
       return;
     }
     // Existing logic...
   };
   ```

3. Get additional context from `useScan()`:
   ```tsx
   const { 
     startScan, 
     isScanning, 
     cancelScan,
     projectName: scanningProjectName,
     realtimeFindings 
   } = useScan();
   ```

4. Add the modal component at the bottom with other modals

5. Remove the inline "Analysis in Progress" block from the editor view (no longer needed since it's now a modal)

---

## Visual Design

### Modal Layout

```text
+--------------------------------------------------+
|  Analysis in Progress                         [X] |
+--------------------------------------------------+
|                                                  |
|  [Spinner]  Analysing "MyProject"                |
|                                                  |
|  ─────────────────────────────────────────────   |
|                                                  |
|  Findings Discovered (3)                         |
|  +----------------------------------------------+|
|  | [Critical] Reentrancy vulnerability in with..|
|  | [High] Unchecked external call in transfer() |
|  | [Medium] Missing access control on admin fn  |
|  +----------------------------------------------+|
|                                                  |
|  (or "Scanning for vulnerabilities..." if empty) |
|                                                  |
+--------------------------------------------------+
|  [ Cancel Analysis ]                    [ Close ] |
|  ⚠️ Cancelling will not refund credits           |
+--------------------------------------------------+
```

### Severity Badge Colors (reuse existing)
- Critical: red/critical
- High: destructive/red
- Medium: warning/yellow  
- Low: primary/blue
- Info: slate/gray

---

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/components/AnalysisInProgressModal.tsx` | Create | New modal component with live findings display |
| `src/pages/Index.tsx` | Modify | Add modal state, update handleNewAudit, add modal to render |

---

## Technical Details

### Severity Badge Component (inline in modal)
```tsx
const severityColors = {
  critical: "text-critical bg-critical/10",
  high: "text-destructive bg-destructive/10",
  medium: "text-warning bg-warning/10",
  low: "text-primary bg-primary/10",
  info: "text-slate-400 bg-slate-400/10",
};
```

### Findings Display
- Use ScrollArea for the findings list (max-height: 300px)
- Each finding is a compact row with severity badge + truncated title
- Real-time updates via `realtimeFindings` from ScanContext
- Show count in section header

### Cancel Handling
- Cancel button calls `cancelScan` from context
- Close the modal after cancel
- Show toast notification (already handled by context)

