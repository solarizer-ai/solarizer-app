

# Remove Default CSS/JSON Files from Code Editor

## Problem

When opening the code editor to add code, Sandpack displays unwanted default files like:
- `index.html`
- `styles.css`
- `index.js`
- `package.json`

These are standard web project files that are irrelevant for Solidity smart contract auditing.

## Root Cause

In `src/components/SandpackEditor.tsx`, the `SandpackProvider` component is initialized **without a `template` prop**. When no template is specified, Sandpack defaults to the `vanilla` template which automatically injects standard web project files alongside the user's custom files.

**Current Code (line 402-408):**
```typescript
<SandpackProvider
  files={initialFiles}
  theme={theme === "dark" ? solarizerDarkTheme : solarizerLightTheme}
  options={{
    activeFile: normalizedActiveFile,
    visibleFiles: fileKeys,
  }}
>
```

## Solution

Add `template="static"` to the `SandpackProvider`. The `static` template is the most minimal template available - it does not inject any default JavaScript, CSS, or configuration files. This is perfect for a code-only editor where we want to display exactly what the user provides.

---

## Technical Changes

### File: `src/components/SandpackEditor.tsx`

**Modification at lines 402-408:**

Add `template="static"` to prevent Sandpack from injecting default files:

```typescript
<SandpackProvider
  template="static"  // ← ADD THIS LINE
  files={initialFiles}
  theme={theme === "dark" ? solarizerDarkTheme : solarizerLightTheme}
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
| File explorer shows `index.html`, `styles.css`, `package.json`, etc. | File explorer shows only user's uploaded/created files |
| Confusing for users | Clean, focused on Solidity contracts |

This is a single-line change that will remove all the unwanted default files from the code editor.

