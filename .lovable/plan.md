
# Fix: Send Full File Paths to n8n Backend

## Problem Identified

The files sent to the n8n `run-audit` backend only contain filenames (`Constants.sol`) instead of full paths (`src/Constants.sol`). This happens because the file list is prepared in `src/pages/Index.tsx` using `f.name` instead of `f.path`.

## Root Cause

In `src/pages/Index.tsx` at lines 166-169:

```typescript
// Current (broken): Uses f.name
const fileList = getAllFiles(files).map(f => ({
  name: f.name,          // Only "Constants.sol"
  content: f.content || '',
}));
```

This code converts the `FileNode[]` structure to simple file objects for the API, but loses the directory information by using just the filename.

## Solution

Update the file mapping to use `f.path` instead of `f.name`:

```typescript
// Fixed: Uses f.path
const fileList = getAllFiles(files).map(f => ({
  name: f.path,          // Full path: "src/Constants.sol"
  content: f.content || '',
}));
```

## File to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Line 167: Change `f.name` to `f.path` |

## Technical Details

### Change in Index.tsx (line 166-169)

**Before:**
```typescript
const fileList = getAllFiles(files).map(f => ({
  name: f.name,
  content: f.content || '',
}));
```

**After:**
```typescript
const fileList = getAllFiles(files).map(f => ({
  name: f.path,  // Use full path for n8n backend
  content: f.content || '',
}));
```

## Why Previous Fix Didn't Work

My previous change in `AuditWizard.tsx` only affected:
- `getScopeFilesForEstimation()` - used for the **cloc-estimate** edge function (estimation step)
- `getContextFilesForEstimation()` - also for estimation

The actual audit submission happens in `Index.tsx`, which calls `runAudit.mutateAsync()` with a separately constructed `fileList`. This is the code path that sends data to n8n.

## Data Flow

```text
AuditWizard.tsx                    Index.tsx
      │                                 │
      │ onComplete() ───────────────────▶ handleStartScan()
      │   - passes files: FileNode[]          │
      │   - passes scope: string[]            ▼
      │                              fileList = getAllFiles(files).map(f => ({
      │                                name: f.name,  // ← FIX THIS
      │                                content: ...
      │                              }))
      │                                       │
      │                                       ▼
      │                              runAudit.mutateAsync({
      │                                files: fileList,  // sent to n8n
      │                                scope: scope,
      │                                ...
      │                              })
```

## Verification

After this fix, the n8n webhook should receive:
- `files[0].name`: `"src/Constants.sol"` (not `"Constants.sol"`)
- `files[1].name`: `"src/CoveredMetavault.sol"` (not `"CoveredMetavault.sol"`)
- etc.
