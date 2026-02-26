

# Fix: Screen Blanks After Folder Upload

## Root Cause

In `src/components/FolderUploader.tsx`, two `useCallback` hooks are called inline inside JSX props:

```tsx
onDragOver={useCallback((e: React.DragEvent) => { ... }, [])}
onDragLeave={useCallback((e: React.DragEvent) => { ... }, [])}
```

This violates React's Rules of Hooks (hooks must be called at the top level, not inside JSX or conditionally). When the component re-renders after files are uploaded (switching from the drop zone to the "files uploaded" view), the hooks are no longer called, causing React to crash and blank the screen.

## Fix

Replace `FolderUploader.tsx` with the exact version from the spec (commit `a83cb68`). The key difference is that `handleDragOver` and `handleDragLeave` are properly defined as top-level `useCallback` hooks, and the `countFiles`/`getTotalSize` functions are also repositioned for clarity.

## Files Changed

**`src/components/FolderUploader.tsx`** -- Replace with exact spec version:
- Move `handleDragOver` and `handleDragLeave` to top-level `useCallback` declarations
- Use `handleDragOver` and `handleDragLeave` as prop references instead of inline hook calls
- Also uses `@ts-ignore` comments for `webkitdirectory` prop instead of the spread cast
- Repositions `countFiles` and `getTotalSize` helper functions

No other files need changes -- the bug is isolated to the inline hook violation in this one component.

