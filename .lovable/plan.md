

# Combined Fix: nLOC Estimation & Scope Selection Bug

This plan addresses two related issues in the audit wizard flow.

---

## Issue 1: nLOC Estimation Failure for Empty Files

### Problem
The `cloc-estimate` edge function rejects files with empty content (`''`) because the validation check `!file.content` treats empty strings as invalid.

### Root Cause
In `supabase/functions/cloc-estimate/index.ts`:
```typescript
if (!file.content || typeof file.content !== 'string') {
  return { valid: false, error: `Invalid file content at index ${i}` };
}
```
Empty strings are falsy in JavaScript, causing legitimate empty files to fail validation.

### Solution
Change the validation to only check the type, allowing empty strings:
```typescript
if (typeof file.content !== 'string') {
  return { valid: false, error: `Invalid file content at index ${i} (expected string, got ${typeof file.content})` };
}
```

---

## Issue 2: Global File Deselection in Scope Selection

### Problem
When deselecting a file in one folder, all files with the same name across all folders are deselected.

### Root Cause
The `ScopeSelectionStep` component tracks selected files by **file name only** instead of **full file path**:

```typescript
// Current (broken): Uses file.name
const isSelected = selectedScope.includes(node.name);
onToggleFile(node.name)  // Passes just "Token.sol"

// Multiple files with same name collide:
// "contracts/Token.sol" → stored as "Token.sol"
// "test/Token.sol"      → stored as "Token.sol" (same key!)
```

### Solution
Use the full file path (`node.path`) as the unique identifier instead of just the name:

```typescript
// Fixed: Uses file.path
const isSelected = selectedScope.includes(node.path);
onToggleFile(node.path)  // Passes "contracts/Token.sol"

// Now properly distinguished:
// "contracts/Token.sol" → stored as "contracts/Token.sol"
// "test/Token.sol"      → stored as "test/Token.sol"
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/cloc-estimate/index.ts` | Fix empty string validation |
| `src/components/wizard/ScopeSelectionStep.tsx` | Use `path` instead of `name` for selection tracking |

---

## Technical Details

### ScopeSelectionStep.tsx Changes

**1. ScopeTreeItem - File rendering (line 46, 53, 64):**
```typescript
// Before
const isSelected = selectedScope.includes(node.name);
onClick={() => onToggleFile(node.name)}

// After  
const isSelected = selectedScope.includes(node.path);
onClick={() => onToggleFile(node.path)}
```

**2. ScopeTreeItem - Folder selection count (line 87):**
```typescript
// Before
const selectedCount = solidityFilesInFolder.filter(f => selectedScope.includes(f)).length;

// After (receives paths now)
const selectedCount = solidityFilesInFolder.filter(f => selectedScope.includes(f)).length;
// (No change needed - just receives paths instead of names)
```

**3. getSolidityFilesInFolder helper (line 227-233):**
```typescript
// Before: Returns file names
return node.name.endsWith('.sol') ? [node.name] : [];

// After: Returns file paths
return node.name.endsWith('.sol') ? [node.path] : [];
```

**4. allSolidityFileNames computed value (line 171-174):**
```typescript
// Before
const allSolidityFileNames = useMemo(() => 
  allSolidityFiles.map(f => f.name),
  [allSolidityFiles]
);

// After (rename to allSolidityFilePaths for clarity)
const allSolidityFilePaths = useMemo(() => 
  allSolidityFiles.map(f => f.path),
  [allSolidityFiles]
);
```

**5. Flat list fallback (lines 313, 321, 332):**
```typescript
// Before
const isSelected = selectedScope.includes(file.name);
onClick={() => handleToggleFile(file.name)}

// After
const isSelected = selectedScope.includes(file.path);
onClick={() => handleToggleFile(file.path)}
```

### cloc-estimate/index.ts Changes

**Line 74-77:**
```typescript
// Before
if (!file.content || typeof file.content !== 'string') {
  return { valid: false, error: `Invalid file content at index ${i}` };
}

// After
if (typeof file.content !== 'string') {
  return { valid: false, error: `Invalid file content at index ${i} (expected string, got ${typeof file.content})` };
}
```

---

## Impact on Backend

The `run-audit` edge function receives the `scope` array containing file paths. Since we're changing from names to paths:

- **Before:** `scope: ["Token.sol", "Vault.sol"]`
- **After:** `scope: ["contracts/Token.sol", "contracts/Vault.sol"]`

The backend (n8n) uses this to identify which files are in-scope. Using paths is actually more correct and prevents ambiguity when the same filename exists in multiple folders.

---

## Testing Verification

After implementation:

1. **Empty file fix:** Import a repo with empty `.sol` files → estimation should complete without "Invalid file content" error

2. **Scope selection fix:**
   - Upload a project with duplicate file names in different folders (e.g., `src/Token.sol` and `test/Token.sol`)
   - Select both files
   - Deselect one file
   - Verify only that specific file is deselected, not both

