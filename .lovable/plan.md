

# Fix: Show scope files from `scope_metadata` when `system_hologram` is empty

## Problem
The Scope tab shows "No contract scope data available" even though the audit has scope data. This happens because:
- `ScopeTab` only reads from `systemHologram.all_files` and `systemHologram.scope`
- The `system_hologram` column is always `{}` (empty) in the database
- The actual file data lives in `scope_metadata` (array of `{path, nLOC, complexity}`) and `context_metadata`

## Fix

### `src/components/ScopeTab.tsx`

1. **Add `scopeMetadata` and `contextMetadata` to props**:
   ```typescript
   scopeMetadata?: Array<{ path: string; nLOC: number; complexity: string }> | null;
   contextMetadata?: Array<{ path: string }> | null;
   ```

2. **Derive `allFiles` and `scopeFiles` from both sources** -- prefer `system_hologram` if populated, otherwise fall back to `scope_metadata`/`context_metadata`:
   - `scopeFiles` = `systemHologram.scope` or `scopeMetadata.map(f => f.path)`
   - `allFiles` = `systemHologram.all_files` or combine scope + context paths

3. Update the `fileTree` and `getFileStatus` logic to use these derived arrays instead of reading directly from `systemHologram`.

### `src/pages/Report.tsx`

4. **Pass the new props** to `ScopeTab`:
   ```typescript
   <ScopeTab
     ...
     scopeMetadata={currentAudit?.scope_metadata as any}
     contextMetadata={currentAudit?.context_metadata as any}
   />
   ```

## Result
Scope tab will display the file tree with scope files marked as "analysed" (for completed audits) and context files marked as "context", using the data that already exists in every audit record.
