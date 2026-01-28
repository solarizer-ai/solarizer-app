
# Remove Code Editor from Solarizer

## Overview

Completely remove the code editor feature from Solarizer, including all related components, utilities, and the "Code Editor" upload method option.

## Files to Delete

| File/Folder | Purpose |
|-------------|---------|
| `src/components/SandpackEditor.tsx` | Main Sandpack-based code editor component |
| `src/components/CodeEditor.tsx` | Monaco-based code editor (unused but present) |
| `src/lib/sandpackUtils.ts` | File conversion utilities for Sandpack |
| `src/lib/sandpackTheme.ts` | Theme definitions for Sandpack |
| `src/components/editor/NewFileDialog.tsx` | Dialog for creating new files |
| `src/components/editor/NewFolderDialog.tsx` | Dialog for creating new folders |
| `src/components/editor/DeleteConfirmDialog.tsx` | Confirmation dialog for deletion |
| `src/components/editor/RenameDialog.tsx` | Dialog for renaming files |

## Files to Modify

### 1. `src/components/AuditWizard.tsx`

**Remove:**
- Import of `SandpackEditor` (line 13)
- The `editorCode` state (line 65)
- The `SAMPLE_CODE` constant (lines 44-49)
- Logic in `handleMethodSelect` for 'editor' method (lines 76-79)
- The entire `{step === 'input' && uploadMethod === 'editor' && (...)}` block (lines 274-298)

**Update:**
- The `canProceedToScope` function no longer needs to handle the editor case

### 2. `src/components/wizard/UploadMethodStep.tsx`

**Remove:**
- The `Code` icon import from lucide-react (line 1)
- The 'editor' option from the `UploadMethod` type (line 12)
- The entire "Code Editor" button block (lines 152-182)

**Update:**
- Change grid from 3 columns to 2 columns: `grid-cols-1 md:grid-cols-2` (line 34)

---

## Technical Details

### Dependencies That Can Be Removed

After these changes, the following npm packages will no longer be used:
- `@codesandbox/sandpack-react` - Only used by SandpackEditor
- `jszip` - Only used by SandpackEditor for ZIP downloads

These can be removed from `package.json` to reduce bundle size.

### Type Changes

The `UploadMethod` type in `UploadMethodStep.tsx` changes from:
```typescript
export type UploadMethod = 'folder' | 'editor' | 'github';
```
to:
```typescript
export type UploadMethod = 'folder' | 'github';
```

### Result

After implementation:
- The wizard will only show 2 upload options: "Upload Folder" and "Import from GitHub"
- No code editor components will exist in the codebase
- Bundle size will be reduced (Sandpack and JSZip removed)
- The audit flow remains intact for folder uploads and GitHub imports
