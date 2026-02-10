

# Fix: Solidity Code Blocks Not Rendering in Remediation Guide

## Problem

The remediation text stored in the database contains code blocks without triple-backtick delimiters. Instead of:

````
```solidity
function foo() { ... }
```
````

The data looks like:

```text
...some text.

solidity
function foo() { ... }
```

The current `renderWithCodeFormatting` regex only matches triple-backtick fenced blocks, so these unfenced code blocks render as plain inline text.

## Fix

### File: `src/components/FindingItem.tsx`

Update `renderWithCodeFormatting` to detect unfenced code blocks. After the existing triple-backtick extraction pass, add a second pass on remaining text segments that detects the pattern:

- A line containing only a known language identifier (e.g., `solidity`, `sol`, `javascript`, `python`, etc.)
- Followed by lines that look like code (containing `{`, `}`, `function`, `require`, `//`, etc.)

**Implementation approach:**

1. After the triple-backtick extraction loop (around line 200), add a post-processing step on text segments
2. For each text segment, use a regex like: `/\n(solidity|sol)\n([\s\S]+?)(?=\n\n|\n[A-Z]|$)/g` to find bare language tags followed by code
3. Split those into proper `codeblock` segment objects so they render with syntax highlighting

This is a minimal change -- only the `renderWithCodeFormatting` function is modified. No other files or database changes needed.

| File | Change |
|------|--------|
| `src/components/FindingItem.tsx` | Add unfenced code block detection in `renderWithCodeFormatting` |

