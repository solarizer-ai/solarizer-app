
# Remove Default Files from Sandpack Code Editor

## Problem

Despite using `template="static"`, Sandpack still shows default files like `index.html`, `package.json`, and `styles.css` in the file explorer. These files are irrelevant for a Solidity smart contract editor.

## Root Cause

The `static` template still includes some boilerplate files. Sandpack requires an entry point file, and if you don't specify one explicitly, it injects default files to serve as that entry point.

## Solution

Remove the `template` prop entirely and instead use `customSetup` with an explicit `entry` pointing to our Solidity file. This tells Sandpack exactly which file is the entry point without needing any template files.

---

## Technical Changes

### File: `src/components/SandpackEditor.tsx`

**Changes required:**

1. Remove `template="static"` from SandpackProvider
2. Add `customSetup={{ entry: normalizedActiveFile }}` to explicitly set the entry point to our Solidity file
3. This combination prevents Sandpack from injecting any default template files

**Code change at lines 401-410:**

```typescript
return (
  <SandpackProvider
    files={initialFiles}
    theme={theme === "dark" ? solarizerDarkTheme : solarizerLightTheme}
    customSetup={{
      entry: normalizedActiveFile,
    }}
    options={{
      activeFile: normalizedActiveFile,
      visibleFiles: fileKeys,
    }}
  >
```

---

## Result

| Before | After |
|--------|-------|
| Shows `index.html`, `package.json`, `styles.css` | Shows only user's Solidity files |
| Confusing file explorer | Clean, focused on contract files |

The entry point is explicitly set to the first Solidity file (e.g., `/Contract.sol` or `/Custom.sol`), so Sandpack doesn't need to inject any default files.
