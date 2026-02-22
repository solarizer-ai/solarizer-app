

# Home Page Mobile UI Refinements

## Changes

### 1. Increase Section Heading Sizes (Consistent)
Both "Context-Aware Analysis" and "Intelligence Engine" headings will be bumped to the same larger mobile size: `text-2xl` on mobile (currently `text-xl` for pipeline and `text-2xl` for intelligence engine -- making both `text-2xl`).

**File:** `src/pages/Home.tsx`
- Line 158: Change `text-xl md:text-4xl` to `text-2xl md:text-4xl`
- Line 204: Already `text-2xl md:text-4xl` -- no change needed

### 2. Remove Subtitles from Pipeline Phases
Remove the `<h3>` subtitle line (e.g., "Smart Scoping", "Exploit Intelligence") from each pipeline phase card, keeping only the pill label and description.

**File:** `src/pages/Home.tsx`
- Line 187: Delete the `<h3>` element rendering `phase.title`

### 3. Compact Terminal on Mobile
Reduce the fixed mobile height from `h-[360px]` to `h-[300px]` so it looks more like a compact desktop window rather than stretching vertically.

**File:** `src/components/TerminalAuditDemo.tsx`
- Line 221: Change `h-[360px] sm:h-[420px] md:h-[480px]` to `h-[300px] sm:h-[420px] md:h-[480px]`

