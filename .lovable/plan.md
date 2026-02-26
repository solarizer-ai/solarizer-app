
# Add pg_cron Stale Audit Detection

## Overview
Schedule a recurring database job that auto-fails orphaned audits when the Cloud Run orchestrator crashes without reporting failure.

## What it does
A cron job runs every 10 minutes and:
1. Finds `audit_orchestration` rows stuck in `running` with no progress update for over 1 hour
2. Marks them as `failed` with a timeout error message
3. Updates the corresponding `audits` row so users see the failure in their dashboard

## Implementation

### Single database migration
Create a migration that schedules the `fail-stale-audits` cron job using the already-enabled `pg_cron` extension.

The SQL will:
- Call `cron.schedule()` to register a job named `fail-stale-audits` running every 10 minutes
- First statement: UPDATE `audit_orchestration` rows in `running` status where `updated_at` is older than 1 hour, setting status to `failed`
- Second statement: UPDATE matching `audits` rows from `analyzing` to `failed`, also setting `is_locked = true` and `error_message`, scoped to rows failed in the last 11 minutes to avoid re-processing

### No code changes needed
The dashboard and CLI already handle `failed` status audits correctly -- this just ensures the status gets set even when the orchestrator crashes.

## Technical notes
- `pg_cron` extension is already enabled
- The job is idempotent -- multiple runs on the same stale audit have no additional effect
- The 11-minute window in the second UPDATE prevents re-processing already-failed audits
- If the Cloud Run Job timeout changes from 1 hour, the interval should be updated to match
- `session_id` in `audit_orchestration` maps to `id` (cast to text) in `audits`
