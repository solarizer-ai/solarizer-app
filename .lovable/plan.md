
# Improve Pipeline Cards and Findings Section

## Summary

Three improvements: (1) replace the basic vertical list in "Five phases" with professional feature cards in a grid layout, each with an icon and subtle border styling, (2) fix the terminal to a fixed height so it doesn't jump when findings appear, and (3) redesign the "Finds what matters" section with proper card-based finding items that look polished.

## Changes

### 1. Terminal fixed height (`src/components/TerminalAuditDemo.tsx`)

Change the terminal body from `min-h-[420px]` to a fixed `h-[480px]` with `overflow-hidden`. This prevents the terminal from growing when findings appear during the animation, keeping the layout stable.

Also stop the animation from looping: when frame reaches 8, stop advancing (no reset). Stop the elapsed tick timer too. Keep the spinner active on the final frame.

### 2. Pipeline section redesign (`src/pages/Home.tsx`)

Replace the current left-border vertical list with a responsive grid of cards.

**Layout**: `max-w-5xl` (wider than the current `max-w-2xl`), centered. Headline stays the same ("Five phases. Every contract.") but is now centered with a subtitle.

**Card grid**: A `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` layout with `gap-6`. Each card:
- `rounded-xl border border-border/30 bg-card/30 p-6` with `hover:border-primary/20 transition-colors`
- Top: a lucide icon in orange (`text-primary`) -- each phase gets a unique icon:
  - Complexity Analysis: `Layers` icon
  - DNA Matching: `Dna` icon  
  - Contract Analysis: `Search` icon
  - Cross-Contract Analysis: `GitBranch` icon
  - Report Generation: `FileText` icon
- Below icon: the `.terminal-pill` label (phase name)
- Title in `text-lg font-semibold text-foreground`
- Description in `text-sm text-muted-foreground/70`

The 5 cards fill the grid naturally: 3 on the first row, 2 on the second row centered using `md:col-span-1` on the last two items wrapped in a flex container, or simply let them flow naturally left-aligned.

### 3. Findings section redesign (`src/pages/Home.tsx`)

Replace the plain `divide-y` rows with proper cards. Also widen to `max-w-4xl`.

**Section header**: Centered headline "Finds what matters." with centered subtitle below.

**Finding cards**: Each finding becomes a card with:
- `rounded-xl border border-border/20 bg-card/20 p-6` styling
- Top row: severity badge (same colors as now, but slightly larger with `px-2.5 py-1 text-[11px] font-mono font-bold rounded-md`) on the left, file reference on the right in mono
- Title: `text-base font-semibold text-foreground mt-3`
- Description: `text-sm text-muted-foreground/60 mt-2 leading-relaxed`

**Layout**: 
- "Known vulnerability patterns" group: 3 cards in a `grid grid-cols-1 md:grid-cols-3 gap-4`
- "Protocol-specific logic" group: 2 cards in a `grid grid-cols-1 md:grid-cols-2 gap-4` with a framing paragraph above

Group labels stay as small uppercase mono labels but are now centered.

### 4. Add icon imports (`src/pages/Home.tsx`)

Add `Layers, Search, GitBranch, FileText` from lucide-react. Also add `Dna` -- if unavailable, use `Fingerprint` as fallback.

## Technical Details

**Files modified:** 2

**`src/components/TerminalAuditDemo.tsx`**:
- Line 204: change `min-h-[420px]` to `h-[480px]`
- Lines 150-162: modify frame advancement useEffect to stop at frame 8 instead of looping
- Lines 171-174: stop elapsed tick when frame reaches 8

**`src/pages/Home.tsx`**:
- Add icon imports from lucide-react
- Add icon mapping to the `phases` data array
- Lines 156-175 (pipeline section): replace the `max-w-2xl` left-border list with a `max-w-5xl` centered grid of cards
- Lines 177-210 (findings section): replace `max-w-2xl` `divide-y` layout with `max-w-4xl` card grid layout
- `FindingRow` component: redesigned as `FindingCard` with border, background, and structured layout

**No new dependencies. No database changes.**
