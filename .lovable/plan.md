

# Add 'gas' severity to save-finding edge function

## Problem
The `save-finding` edge function rejects findings with `severity: 'gas'` because it's not in the allowed list, causing all QA gas optimization findings to be silently lost during audits.

## Fix (2 line changes in `supabase/functions/save-finding/index.ts`)

1. **Line 15** -- Add `'gas'` to the `FindingInput` severity type union:
   ```typescript
   severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'gas';
   ```

2. **Line 98** -- Add `'gas'` to the runtime validation array:
   ```typescript
   const validSeverities = ['critical', 'high', 'medium', 'low', 'info', 'gas'];
   ```

No other files need changes -- the dashboard already handles the `gas` severity with proper colors, icons, and filtering.
