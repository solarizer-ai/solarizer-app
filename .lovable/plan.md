

# Fix: Ensure Full File Paths Are Sent to n8n Backend

## Problem Confirmed

From your n8n execution screenshot, the `files` array being received shows:
- `files[0].name`: `Constants.sol` (missing folder path)
- `files[1].name`: `CoveredMetavault.sol` (missing folder path)

But the scope array correctly contains full paths like `src/Constants.sol`.

## Root Cause

The code at `src/pages/Index.tsx` line 167 currently reads:

```typescript
const fileList = getAllFiles(files).map(f => ({
  name: f.path,  // Use full path for n8n backend
  content: f.content || '',
}));
```

**The code shows `f.path` but the deployed version appears to still have `f.name`.** This is a deployment synchronization issue where the previous change hasn't taken effect.

## Solution

Re-apply the fix to ensure the change is properly deployed. The line must use `f.path` (full path like `src/Constants.sol`) instead of `f.name` (just filename like `Constants.sol`).

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/Index.tsx` | 167 | Ensure `name: f.path` is used (re-deploy) |

## Technical Change

**Current deployed (broken):**
```typescript
const fileList = getAllFiles(files).map(f => ({
  name: f.name,           // Only filename: "Constants.sol"
  content: f.content || '',
}));
```

**Required fix:**
```typescript
const fileList = getAllFiles(files).map(f => ({
  name: f.path,           // Full path: "src/Constants.sol"
  content: f.content || '',
}));
```

## Expected Result After Fix

n8n should receive:
```json
{
  "files": [
    { "name": "src/Constants.sol", "content": "..." },
    { "name": "src/CoveredMetavault.sol", "content": "..." },
    { "name": "libraries/PercentageLib.sol", "content": "..." },
    { "name": "interfaces/ICoveredMetavault.sol", "content": "..." }
  ],
  "scope": [
    "src/Constants.sol",
    "src/CoveredMetavault.sol"
  ]
}
```

## Data Flow Reference

```text
FolderUploader / GitHubImport
        │
        ▼ FileNode[] with { name: "Constants.sol", path: "src/Constants.sol" }
        │
AuditWizard.onComplete()
        │
        ▼ passes: { files: FileNode[], scope: string[] }
        │
Index.tsx → handleStartScan()
        │
        ▼ fileList = getAllFiles(files).map(f => ({ name: f.path, ... }))
        │
run-audit edge function
        │
        ▼ n8n webhook receives { files: [{ name: "src/Constants.sol", ... }] }
```

## Verification Steps

After deployment:
1. Upload a project with nested folders (e.g., `src/`, `interfaces/`, `libraries/`)
2. Run an audit
3. Check n8n execution input to verify `files[].name` contains full paths

