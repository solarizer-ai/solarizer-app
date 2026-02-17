
# Remove n8n Integration and Make Solarizer CLI-Only

## Summary

Remove all n8n webhook integration and the web-based audit creation flow. The web app will remain for viewing reports, managing settings, billing, etc., but audits will only be created via the CLI.

## Changes

### Edge Functions to DELETE (3 functions)

1. **`supabase/functions/cloc-estimate/`** -- Calls `N8N_WEBHOOK_URL` for CLOC estimation. CLI handles this locally.
2. **`supabase/functions/run-audit/`** -- Calls `N8N_AUDIT_WEBHOOK_URL` to trigger the n8n audit engine. CLI uses its own session-based flow.
3. **`supabase/functions/check-stale-audits/`** -- Cron job that uses `N8N_CALLBACK_SECRET`. Can be removed or kept; since CLI manages its own lifecycle.

### Edge Functions to UPDATE (3 functions -- rename secret references)

4. **`supabase/functions/save-finding/index.ts`** -- Rename `N8N_CALLBACK_SECRET` references to `CALLBACK_SECRET` (or a generic name). Logic stays the same -- the CLI backend still calls this.
5. **`supabase/functions/complete-audit/index.ts`** -- Same rename of `N8N_CALLBACK_SECRET` to `CALLBACK_SECRET`.
6. **`supabase/functions/fail-audit/index.ts`** -- Same rename of `N8N_CALLBACK_SECRET` to `CALLBACK_SECRET`.

### Frontend Files to DELETE (web audit wizard components)

7. **`src/components/AuditWizard.tsx`** -- The multi-step wizard for web audit creation.
8. **`src/components/wizard/ProjectNameStep.tsx`** -- Wizard step.
9. **`src/components/wizard/UploadMethodStep.tsx`** -- Wizard step.
10. **`src/components/wizard/ScopeSelectionStep.tsx`** -- Wizard step.
11. **`src/components/wizard/EstimatorStep.tsx`** -- Wizard step (uses `useClocEstimate`).
12. **`src/components/wizard/ContextStep.tsx`** -- Wizard step.
13. **`src/components/wizard/GitHubImportStep.tsx`** -- Wizard step.
14. **`src/components/FileUploader.tsx`** -- File upload for wizard.
15. **`src/components/FolderUploader.tsx`** -- Folder upload for wizard.
16. **`src/components/FileExplorer.tsx`** -- File tree for wizard.
17. **`src/components/FileTreeItem.tsx`** -- File tree item.
18. **`src/components/FileTypeIcon.tsx`** -- File type icon.
19. **`src/components/ScanningProgress.tsx`** -- Web scan animation (unused import-wise).
20. **`src/components/ScanProgressWidget.tsx`** -- Floating progress widget (not imported anywhere).
21. **`src/components/AnalysisInProgressModal.tsx`** -- Analysis in-progress modal.

### Frontend Hooks to DELETE

22. **`src/hooks/useRunAudit.ts`** -- Calls `run-audit` edge function (being deleted).
23. **`src/hooks/useClocEstimate.ts`** -- Calls `cloc-estimate` edge function (being deleted).
24. **`src/hooks/useActiveAnalyses.ts`** -- Only used by `AnalysisInProgressModal`.

### Frontend Context to DELETE

25. **`src/contexts/ScanContext.tsx`** -- Provides web scanning state, realtime subscriptions for web-initiated audits. Only used in `Index.tsx` and `App.tsx`.

### Frontend Files to UPDATE

26. **`src/pages/Index.tsx`** -- Major simplification:
    - Remove the "editor" view entirely (the `AuditWizard`, `handleStartScan`, file upload state, etc.)
    - Remove imports for `AuditWizard`, `useRunAudit`, `useScan`, `FileNode`, `AnalysisInProgressModal`, `ScanProgressWidget`
    - Remove `pendingFiles` state, `handleStartScan`, `handleUpgradeNeeded`, `handlePowerUpNeeded`
    - The "Run Analysis" button becomes a link/message directing users to use the CLI
    - Keep: dashboard view, audit list, delete, view results, credit balance, subscription prompts

27. **`src/App.tsx`** -- Remove `ScanProvider` wrapper import and usage.

### Config Update

28. **`supabase/config.toml`** -- Remove entries for `cloc-estimate`, `run-audit`, and `check-stale-audits`.

## Technical Details

- The `save-finding`, `complete-audit`, and `fail-audit` functions are still needed -- they are server-to-server callbacks used by the CLI backend. Only the env var name changes from `N8N_CALLBACK_SECRET` to `CALLBACK_SECRET`.
- A new secret `CALLBACK_SECRET` should be set with the same value as the current `N8N_CALLBACK_SECRET`.
- The `check-stale-audits` function is borderline -- it guards against stuck audits regardless of source. It can be kept if desired, but since it references the n8n pattern, the plan includes removing it. Can be re-added later if needed for CLI audits.
- The dashboard "Run Analysis" button will be replaced with guidance to use the CLI tool.
- All report viewing, audit listing, settings, billing, and sharing features remain untouched.
