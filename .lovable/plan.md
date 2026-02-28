

# Hide Report Sections During Active Audit

## Problem
When an audit is in progress (`status === 'analyzing'`), the Report page shows the Remediation Progress widget, tab bar (Scope, Insights, Invariants, Findings, Coverage, Archive), and all tab content. These sections are meaningless during analysis since data hasn't been generated yet.

## Fix (single file: `src/pages/Report.tsx`)

Wrap the Remediation Progress widget (line 432-434) and the entire Tabs block (lines 437-621) with an `{!isLive && (...)}` guard so they only render after the audit completes successfully.

The AuditProgressPanel (lines 408-414) already has its own `{isLive && ...}` guard, so it will continue to show during analysis. The SecurityScoreCard (lines 417-429) also already has `{!isLive && ...}`.

### What changes

Lines 431-621 get wrapped:

```
{!isLive && (
  <>
    {/* Remediation Progress - Business only */}
    {canCommentOnFindings && (
      <RemediationProgressWidget auditId={currentAudit.id} />
    )}

    {/* Tabbed Interface */}
    <Tabs ...>
      ...all tab content unchanged...
    </Tabs>
  </>
)}
```

This means during an active audit, the user sees only:
- The project name header with "Analysing..." subtitle
- The AuditProgressPanel with live phase/contract tracking

Once the audit transitions to a terminal state (completed/failed/cancelled), `isLive` becomes false and the full report UI appears.

