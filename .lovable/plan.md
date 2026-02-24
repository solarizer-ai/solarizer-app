

# Intelligence Engine: Animated Pipeline Line with Icon Color-Up Effect

Add a scroll-triggered animation to the Intelligence Engine pipeline section where an orange line travels down through the icons, coloring them up as it passes.

---

## How It Works

1. The dashed vertical connector line is replaced with a solid orange "progress" line that grows from 0% to 100% height as the section scrolls into view.
2. Each icon circle starts greyed out (muted border, grey icon color).
3. As the orange line reaches each icon's vertical position, the icon transitions from grey to the orange primary color with a smooth fade.
4. Uses `IntersectionObserver` to trigger the animation when the section enters the viewport, and a CSS transition on the line height + icon colors.

---

## Visual Behavior

```text
Before scroll:          After animation:

  (grey) Layers           (orange) Layers
    |                        |  <-- solid orange
  (grey) Fingerprint      (orange) Fingerprint
    |                        |
  (grey) Search           (orange) Search
    |                        |
  (grey) GitBranch        (orange) GitBranch
    |                        |
  (grey) FileText         (orange) FileText
```

---

## Technical Details

### File: `src/pages/Home.tsx`

1. Add `useEffect` and `useRef` imports (already has `useState`).
2. Create a ref for the pipeline container and a state `progress` (0 to 1).
3. Use `IntersectionObserver` + scroll listener: when the section is in view, map scroll position to a 0-1 progress value based on how far through the section the user has scrolled.
4. Replace the static dashed line div with two layers:
   - A dashed grey line (full height, background).
   - A solid orange line (`height: ${progress * 100}%`, foreground) that grows.
5. For each phase icon, compute a threshold (e.g., phase index / total phases). If `progress >= threshold`, apply orange styling; otherwise grey styling. Use CSS `transition` for smooth color change.

### Changes Summary

| Element | Before | After |
|---------|--------|-------|
| Vertical line | Static dashed grey | Dashed grey background + growing solid orange overlay |
| Icon circles | Always orange (`text-primary`, `border-border/30`) | Start grey (`text-muted-foreground/40`, `border-border/20`), transition to orange when line reaches them |
| Icon transition | None | `transition-colors duration-500` for smooth color-up |

No new files or dependencies needed -- uses native `IntersectionObserver` and existing Tailwind classes.
