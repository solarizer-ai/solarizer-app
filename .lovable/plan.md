

# Add enrichment fields to `update-findings-batch`

## Problem
The edge function only persists 5 fields (`verification_status`, `severity`, `line_start`, `line_end`, `code_snippet`). Enrichment fields (`description`, `impact`, `remediation`, `function`) sent by the proxy after Phase 6 are silently dropped.

## Changes

### `supabase/functions/update-findings-batch/index.ts`

1. **Extend the `UpdateEntry` interface** (lines 12-19) to include the 4 new optional fields:
   - `description?: string`
   - `impact?: string`
   - `remediation?: string`
   - `function?: string`

2. **Add 4 field checks** after line 119 (the `code_snippet` check), following the same pattern:
   ```typescript
   if (entry.description !== undefined) fields.description = entry.description;
   if (entry.impact !== undefined) fields.impact = entry.impact;
   if (entry.remediation !== undefined) fields.remediation = entry.remediation;
   if (entry.function !== undefined) fields.function = entry.function;
   ```

3. **Deploy** the updated function.

No other files change. No database migration needed -- these columns already exist in the `findings` table.
