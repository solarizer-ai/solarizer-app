

# Allow Multiple Concurrent Audits

## Summary

Remove the single-audit concurrency restriction across the entire platform (web UI and CLI edge functions), allowing users on all plans to run multiple audits simultaneously.

## Changes

### 1. Frontend: `src/pages/Index.tsx`

- Remove the `hasActiveAnalysis` check and `analysisInProgress` guard that blocks the wizard when an audit is in progress (lines ~150-156, ~262-266)
- Users will always be able to click "Run Analysis" and start a new audit regardless of existing active audits
- Keep the `AnalysisInProgressModal` component available but it will no longer block new audits -- it can be repurposed or removed

### 2. Frontend: `src/hooks/useActiveAnalyses.ts`

- Keep this hook as-is since it may still be useful for displaying active analyses, but it will no longer gate new audit creation

### 3. Edge Function: `supabase/functions/cli-session-start/index.ts`

- Remove the "Enforce 1 concurrent audit per user" block (lines ~132-148) that checks for active audits and returns a 409 error
- Allow CLI users to start new sessions regardless of existing active audits

### 4. Edge Function: `supabase/functions/cli-auth/index.ts`

- Keep the active audit query but change it to return a list of active audits (informational only, no blocking)

### 5. Edge Function: `supabase/functions/cli-check-credits/index.ts`

- Same as cli-auth: keep active audit info as informational, no blocking behavior

### 6. Component: `src/components/AnalysisInProgressModal.tsx`

- Update the description text to remove "Please wait for current analyses to complete before starting a new one" since it no longer blocks
- Optionally convert to an informational panel rather than a blocking modal

## Technical Details

- **`src/pages/Index.tsx`**: Remove `hasActiveAnalysis` computed value and the `analysisInProgress` guard in `handleNewAudit`. The `isScanning` local state check can also be relaxed.
- **`cli-session-start/index.ts`**: Delete the entire block from the `activeAudits` query through the 409 response (approximately lines 132-148).
- **`cli-auth/index.ts`** and **`cli-check-credits/index.ts`**: These already return active audit info without blocking -- no changes needed, or optionally update to return multiple active audits instead of `.limit(1)`.
- No database schema changes required.

