

# Sharing Page: Show Shared Reports Overview

## What Changes

Replace the static info-only Sharing page with a live table showing all reports the user has shared, who they're shared with, and the invitation status.

## UI Layout

For users with sharing access (Inferno plan):
1. Keep the existing PageHeader
2. Add a new **"Shared Reports"** card above the existing info card
3. The card contains a table with columns:
   - **Report** (project name, linked to the report)
   - **Shared With** (email)
   - **Status** (badge: pending / accepted / expired)
   - **Shared On** (relative date)
   - **Action** (Revoke button)
4. Empty state: "You haven't shared any reports yet. Use the Share button on any report to invite collaborators."

For users without sharing access: keep the existing upgrade prompt (no changes).

## Technical Approach

**File: `src/hooks/useAuditSharing.ts`**
- Add a new `useAllMyShares` hook that queries `audit_shares` where `owner_id = auth.uid()`, joining with `audits` to get `project_name`. Since we can't do a Supabase join across tables without a foreign key reference being exposed in the types, we'll query `audit_shares` first, then batch-fetch audit names from `audits` table using the audit IDs.

**File: `src/pages/dashboard/SharingPage.tsx`**
- Import `useAllMyShares`, `useRemoveShare` from the sharing hook
- Import Table components, Badge, Button, formatDistanceToNow
- For Inferno users: render the shared reports table with revoke functionality
- Keep the feature bullet points below as a secondary info card
- Show loading skeleton while data loads
- Show empty state when no shares exist

## Data Flow

1. Query `audit_shares` filtered by `owner_id` (RLS policy already handles this)
2. Query `audits` for the matching audit IDs to get project names
3. Display combined data in the table
4. Revoke uses the existing `useRemoveShare` mutation + invalidates the new query key

## Files Modified
- `src/hooks/useAuditSharing.ts` -- add `useAllMyShares` hook
- `src/pages/dashboard/SharingPage.tsx` -- rebuild with shared reports table
