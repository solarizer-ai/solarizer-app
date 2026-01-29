

# Improve UX: Show "Analysis in Progress" Message with Credit Warning

## Problem
When an analysis is already running, the audit wizard is completely hidden, leaving users confused about why they can't start a new analysis.

## Solution
Replace the hidden wizard with a friendly informational message that explains the situation and provides options to either wait or cancel the current scan. Include a clear warning that cancellation does not refund credits.

---

## Implementation

### Modify `src/pages/Index.tsx`

Update the conditional rendering to show an informative message when a scan is in progress:

**Add new UI block:**
```tsx
{isScanning && !showResults && (
  <div className="text-center py-16 border border-dashed border-border rounded-lg space-y-4">
    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
    <div>
      <h3 className="text-lg font-medium text-foreground mb-2">Analysis in Progress</h3>
      <p className="text-sm text-muted-foreground">
        Please wait for the current analysis to complete before starting a new one.
      </p>
    </div>
    <div className="pt-2">
      <Button variant="outline" onClick={cancelScan} className="gap-2">
        <X className="w-4 h-4" />
        Cancel Current Analysis
      </Button>
      <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
        Note: Cancelling will not refund credits already used for this analysis.
      </p>
    </div>
  </div>
)}

{!isScanning && !showResults && (
  <AuditWizard ... />
)}
```

### Changes Required

1. **Update `useScan()` destructuring** - Add `cancelScan` to the destructured values
2. **Add the "in progress" UI block** - Centered card with:
   - Spinning loader icon
   - "Analysis in Progress" heading
   - Helpful subtext explaining the wait requirement
   - Cancel button with X icon
   - Amber-colored warning about non-refundable credits

---

## Visual Design

The message will appear as a centered card with:
- Spinning loader icon (matches brand style)
- "Analysis in Progress" heading
- Helpful subtext explaining the situation
- Cancel button to abort the current scan
- Warning text in amber color below the button: "Note: Cancelling will not refund credits already used for this analysis."

This follows the same visual pattern as the "No assessments yet" empty state and aligns with the existing amber warning style used for low credit prompts.

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add in-progress message block with credit warning, update useScan destructuring |

