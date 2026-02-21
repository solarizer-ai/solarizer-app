
# Homepage Redesign -- Apple-Level Polish

## Design Critique (Current State)

Looking at the page with a critical eye, several things feel "template-grade" rather than crafted:

1. **Hero**: The headline is large but lacks spatial rhythm. The subtitle reads like a feature list, not a value proposition. The orange gradient on "Security for all" feels decorative rather than intentional. Two competing CTAs dilute focus. No ambient texture -- the background is flat dead space.

2. **Pipeline section**: The 3+2 card grid floats in a sea of empty grey. Cards are uniform rectangles with no visual hierarchy -- every card screams at the same volume. The gap between the pipeline section and findings section is ~300px of nothingness.

3. **Findings section**: Cards are fine structurally but feel disconnected from the pipeline above. The two group labels ("Known vulnerability patterns" / "Protocol-specific logic") are tiny uppercase mono text that gets lost. There is no visual connective tissue between sections.

4. **CTA section**: "Run your first audit." with a copy-paste command and an orange button -- functional but emotionally flat. No sense of momentum or payoff.

5. **Overall rhythm**: Every section uses the same `py-32 md:py-40` spacing, creating a monotonous cadence. Apple pages vary rhythm -- tight clusters followed by breathing room.

---

## Improvement Plan

### 1. Hero Section Overhaul (`src/pages/Home.tsx`)

**Typography cleanup** (as requested):
- Remove `text-gradient` from "Security for all" -- plain `text-foreground`
- Single line: "Security for all" (line break on mobile only), "Accessible instantly" on the same or next line
- Remove full stops from both lines
- Remove "Start Auditing" and "See How It Works" buttons entirely

**Animated background** (as requested):
- Add a `HeroBackground` component with a subtle animated dot-grid pattern
- Implementation: CSS `radial-gradient` creating a 1px dot every 40px, animated with a slow diagonal drift (`background-position` keyframe over 20s)
- A secondary layer: 3-4 very faint concentric circles (absolute positioned divs, `border border-white/[0.03]`, `rounded-full`) that slowly pulse in scale using CSS transforms
- Overall container opacity: 20-30% so it stays atmospheric, not distracting
- This creates a "radar sweep" / "scanning field" feel that matches the security theme -- distinct from open-agent.io's light-mode flowing lines

**Terminal shadow removal** (as requested):
- Remove `shadow-[0_0_80px_rgba(249,115,22,0.07)]` from `TerminalAuditDemo.tsx`

**Remove orange glows** (as requested):
- Delete the `bg-radial-glow` div
- Delete the `bg-primary/[0.06] blur-3xl` div around the terminal

### 2. Pipeline Section -- Numbered Sequence

Replace the uniform card grid with a **numbered vertical sequence** layout that feels more intentional:

- Each phase gets a large number (01-05) in `text-6xl font-black text-white/[0.04]` as a watermark behind the card content
- Cards alternate between left-aligned and right-aligned on desktop (staggered layout), creating visual rhythm
- On mobile: simple vertical stack
- Reduce card descriptions by ~30% -- shorter, punchier copy
- Add a thin vertical line connecting the cards (a `border-l border-dashed border-border/20` running through the left side)

### 3. Findings Section -- Tighter Integration

- Reduce top padding from `py-32` to `py-20` to close the dead-space gap
- Give each finding group a subtle section background: a very faint `bg-white/[0.01]` rounded container that groups the cards together
- Add a count badge next to each group label: "Known vulnerability patterns (3)" in a small pill

### 4. CTA Section -- Sharper Close

- Reduce padding to `py-20`
- Remove "Run your first audit." full stop
- Make the `npm install` block slightly larger with more horizontal padding for breathing room

### 5. CSS Additions (`src/index.css`)

Add the hero background animation keyframe:
```
@keyframes grid-drift {
  0% { background-position: 0px 0px; }
  100% { background-position: 40px 40px; }
}
```

Add a `.hero-dot-grid` utility with the repeating radial-gradient dot pattern.

Add a `.hero-pulse-ring` utility for the concentric circle pulse animation.

---

## Technical Details

**Files modified: 3**

**`src/pages/Home.tsx`**:
- Remove `text-gradient` class, remove full stops, restructure heading to single logical line
- Remove both CTA buttons and `scrollToPipeline` function
- Remove `bg-radial-glow` overlay div (line 125)
- Remove `bg-primary/[0.06] blur-3xl` terminal glow div (line 153)
- Add inline `HeroBackground` component with dot-grid and pulse rings
- Adjust section spacing: pipeline `py-24`, findings `py-20`, CTA `py-20`

**`src/components/TerminalAuditDemo.tsx`**:
- Line 186: Remove `shadow-[0_0_80px_rgba(249,115,22,0.07)]` from the outer div class

**`src/index.css`**:
- Add `@keyframes grid-drift` for the diagonal dot drift
- Add `@keyframes ring-pulse` for concentric circle scale animation
- Add `.hero-dot-grid` utility class
- Add `.hero-pulse-ring` utility class

**No new dependencies. No database changes.**
