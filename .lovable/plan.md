
# Restore Frontend Audit Wizard

## Overview
Bring back the multi-step audit wizard that lets users upload Solidity projects (folder upload or GitHub import), select scope, estimate credits, and submit for server-side security analysis via the Cloud Run proxy. This replaces the old n8n-based flow with a new `web-audit-start` edge function using JWT auth.

## What will change

### 1. New Edge Function: `web-audit-start`
A new backend function that handles frontend-initiated audits:
- Authenticates via JWT (unlike the CLI's API key auth)
- Validates uploaded files (max 500 files, 1MB per file)
- Separates scope vs context files
- Calculates server-side nLOC per scope file using a ported nLOC algorithm
- Calls Cloud Run proxy `/estimate` for complexity classification per file
- Deducts credits atomically with full refund-on-failure cleanup
- Creates audit + orchestration records
- Fires audit to Cloud Run proxy `/audit/run`
- Returns `sessionId` to the frontend

### 2. New Frontend Components (10 files)

**Wizard Steps:**
- `src/components/wizard/ProjectNameStep.tsx` -- Name input with validation
- `src/components/wizard/UploadMethodStep.tsx` -- Choose folder upload or GitHub import
- `src/components/wizard/GitHubImportStep.tsx` -- GitHub URL input with branch/subfolder
- `src/components/wizard/ScopeSelectionStep.tsx` -- Tree-based .sol file selector with checkboxes
- `src/components/wizard/EstimatorStep.tsx` -- Client-side nLOC/credit estimate with plan validation
- `src/components/wizard/ContextStep.tsx` -- Optional additional context textarea

**Supporting Components:**
- `src/components/FileTypeIcon.tsx` -- File extension icons for the tree view
- `src/components/FolderUploader.tsx` -- Drag-and-drop folder upload with file tree rendering
- `src/components/AuditWizard.tsx` -- Main wizard orchestrator managing step flow
- `src/components/ScanProgressWidget.tsx` -- Floating bottom-right widget showing real-time scan progress

### 3. New Context and Hook
- `src/contexts/ScanContext.tsx` -- Global scan state manager with Supabase realtime subscriptions for findings and audit status updates
- `src/hooks/useRunAudit.ts` -- Mutation hook that calls `web-audit-start` via `invokeWithRefresh`

### 4. Modified Files

**`src/pages/Index.tsx`** (and/or `src/pages/dashboard/DashboardHome.tsx`):
- Replace CLI prompt with "New Audit" button (when user has subscription)
- Wire up AuditWizard in a fullscreen overlay
- On wizard completion, call `useRunAudit` then `startScan()` for realtime tracking
- Show `ScanProgressWidget` during active scans

**`src/App.tsx`**:
- Wrap routes with `ScanProvider` so the scan widget persists across navigation

## Wizard Flow
```text
Step 1: Project Name --> Step 2: Upload Method (Folder/GitHub)
  --> Step 3: Upload/Import Files --> Step 4: Select Scope (.sol files)
    --> Step 5: Credit Estimate --> Step 6: Additional Context --> Submit
```

## Key Design Decisions
- **Client-side nLOC is approximate**: The estimator shows "~" prefix and a disclaimer. The server recalculates exact credits on submission using a more precise algorithm
- **Starter plan restrictions**: Folder upload and GitHub import are locked behind Pro+ plans (Starter only gets single-file CLI usage)
- **Realtime progress**: Uses Supabase channels to subscribe to new findings and audit status changes. The floating widget shows severity badges as findings arrive
- **Credit safety**: Server-side deduction with atomic refund on any failure (audit creation, orchestration setup, or unexpected errors)

## Technical Details

### Edge function config
The `web-audit-start` function uses JWT auth (default behavior), so no `config.toml` entry needed with `verify_jwt = false`.

### Environment variables
All required secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `CLOUD_RUN_PROXY_URL`, `SESSION_SECRET`) are already configured.

### Existing code reused (not modified)
- `src/types/files.ts` -- FileNode, getAllFiles, mergeFileTrees
- `src/lib/githubService.ts` -- fetchRepoContents, parseGitHubUrl
- `src/hooks/useGitHubConnection.ts` -- GitHub connection status
- `src/lib/nlocCalculator.ts` -- calculateNLOC, PLAN_LIMITS
- `src/lib/sessionRefresh.ts` -- invokeWithRefresh for edge function calls
- `src/hooks/useSubscription.ts` -- subscription and credits data

### Files to create (13 total)
1. `supabase/functions/web-audit-start/index.ts`
2. `src/components/FileTypeIcon.tsx`
3. `src/components/FolderUploader.tsx`
4. `src/components/wizard/ProjectNameStep.tsx`
5. `src/components/wizard/UploadMethodStep.tsx`
6. `src/components/wizard/GitHubImportStep.tsx`
7. `src/components/wizard/ScopeSelectionStep.tsx`
8. `src/components/wizard/EstimatorStep.tsx`
9. `src/components/wizard/ContextStep.tsx`
10. `src/components/AuditWizard.tsx`
11. `src/components/ScanProgressWidget.tsx`
12. `src/contexts/ScanContext.tsx`
13. `src/hooks/useRunAudit.ts`

### Files to modify (3)
1. `src/pages/Index.tsx` -- Add wizard overlay, "New Audit" button, scan widget
2. `src/pages/dashboard/DashboardHome.tsx` -- Add "New Audit" button, wizard overlay, scan widget
3. `src/App.tsx` -- Wrap with ScanProvider
