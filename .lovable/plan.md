

# Permanent Solution: Remove Default Files from Code Editor

## The Problem

You're right - there are **two issues**:
1. The boilerplate files (`package.json`, `index.html`, `styles.css`) are **visible** in the file explorer
2. Even if hidden, they would be **sent for estimation** because `sandpackFilesToFileNodes` converts ALL files back to FileNodes

## Root Cause Analysis

### Issue 1: Visibility
Line 420: `visibleFiles: fileKeys` includes ALL keys from `initialFiles`, including the hidden boilerplate files.

### Issue 2: Data Leak
Lines 62-79 in `SandpackEditorInner`: The `onFilesChange` callback uses `sandpackFilesToFileNodes(sandpack.files)` which converts **every file** in Sandpack back to FileNodes - including the boilerplate files we injected.

## The Permanent Fix

Fix both issues in **two places**:

---

## Technical Changes

### 1. Filter `visibleFiles` (hides from UI)

**File: `src/components/SandpackEditor.tsx` (lines 405-420)**

```typescript
// Define files to exclude
const SANDPACK_INTERNAL_FILES = [
  "/package.json",
  "/index.html", 
  "/styles.css",
  "/index.js"
];

// Filter visible files to exclude internal Sandpack files
const visibleFileKeys = fileKeys.filter(
  (path) => !SANDPACK_INTERNAL_FILES.includes(path)
);

// Use filtered list in options
options={{
  activeFile: normalizedActiveFile,
  visibleFiles: visibleFileKeys,  // Only user's files
}}
```

### 2. Filter `onFilesChange` output (prevents data leak)

**File: `src/components/SandpackEditor.tsx` (lines 62-79)**

Filter out internal files before syncing back to parent:

```typescript
useEffect(() => {
  if (onFilesChange && sandpack.files) {
    // Filter out Sandpack internal files before syncing
    const INTERNAL_FILES = ["/package.json", "/index.html", "/styles.css", "/index.js"];
    const userFiles = Object.fromEntries(
      Object.entries(sandpack.files).filter(
        ([path]) => !INTERNAL_FILES.includes(path)
      )
    );
    
    const filesSnapshot = JSON.stringify(
      Object.fromEntries(
        Object.entries(userFiles).map(([path, file]) => [path, file.code])
      )
    );
    
    if (filesSnapshot !== previousFilesRef.current) {
      previousFilesRef.current = filesSnapshot;
      const fileNodes = sandpackFilesToFileNodes(userFiles);
      onFilesChange(fileNodes);
    }
  }
}, [sandpack.files, onFilesChange]);
```

### 3. Filter ZIP download (bonus fix)

**File: `src/components/SandpackEditor.tsx` (lines 143-157)**

Don't include internal files in the downloaded ZIP:

```typescript
const handleDownload = useCallback(async () => {
  const INTERNAL_FILES = ["/package.json", "/index.html", "/styles.css", "/index.js"];
  const zip = new JSZip();
  
  Object.entries(sandpack.files)
    .filter(([path]) => !INTERNAL_FILES.includes(path))
    .forEach(([path, file]) => {
      const filePath = path.startsWith("/") ? path.slice(1) : path;
      zip.file(filePath, file.code);
    });
    
  // ... rest unchanged
}, [sandpack.files]);
```

---

## Summary

| Location | Before | After |
|----------|--------|-------|
| `visibleFiles` | All files including boilerplate | Only user's files |
| `onFilesChange` | Syncs all files to parent | Filters out internal files |
| ZIP download | Includes all files | Only user's files |

This ensures internal Sandpack files are:
- Not visible in the file explorer
- Not synced back to the parent component  
- Not sent for nLOC estimation
- Not included in downloads

