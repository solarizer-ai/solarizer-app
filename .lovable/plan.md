

# Add Copy Button, Auto-Format & Indent Code Blocks

## Changes

### File: `src/components/FindingItem.tsx`

**1. Create a `CodeBlock` wrapper component** that wraps all code blocks with:
- A header bar showing the language label on the left and a **Copy** button (using `Copy`/`Check` icons from lucide-react) on the top-right
- On click, copies the raw code text to clipboard and shows a brief checkmark state for 2 seconds

**2. Auto-format and properly indent the code** before rendering:
- Normalize indentation: detect the minimum leading whitespace across non-empty lines and strip it so code is left-aligned at baseline
- **Re-indent based on brace nesting**: track `{` and `}` characters to compute proper indentation depth (2 or 4 spaces per level), so function bodies, if-blocks, etc. are visually nested like in a normal code editor
- Trim trailing whitespace from each line
- Collapse 3+ consecutive blank lines into 1

**3. Apply to all code block locations:**
- Remediation guide code blocks (inside `renderWithCodeFormatting`)
- Affected Code section
- Both use the same `CodeBlock` wrapper

## Technical Details

| Area | Detail |
|------|--------|
| Copy icon | `Copy` and `Check` from `lucide-react` (already installed) |
| Clipboard API | `navigator.clipboard.writeText()` |
| Indentation | Brace-based: increment depth after `{`, decrement before `}`, apply 4-space indent per level |
| Normalization | Strip common leading whitespace first, then re-indent |
| State | Local `useState` for copied feedback, reset after 2s via `setTimeout` |

### Auto-indent logic (pseudocode):

```text
depth = 0
for each line:
  trimmed = line.trim()
  if trimmed starts with '}': depth--
  formatted = '    '.repeat(depth) + trimmed
  if trimmed ends with '{': depth++
  output formatted line
```

### CodeBlock component structure:

```text
+------------------------------------------+
| SOLIDITY                      [Copy icon] |
+------------------------------------------+
| 1 | function foo() {                      |
| 2 |     require(msg.sender == owner);     |
| 3 |     balances[msg.sender] -= amount;   |
| 4 | }                                     |
+------------------------------------------+
```

No new files or dependencies needed -- just updates to `FindingItem.tsx`.

