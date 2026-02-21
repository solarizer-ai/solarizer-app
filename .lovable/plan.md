

# Hero Dots: Orange Glow on Cursor Hover

## Approach

The current dot grid is a pure CSS `background-image` pattern, which cannot respond to cursor position. To create a "dots light up orange near the cursor" effect, we need to layer a radial gradient glow that follows the mouse pointer on top of the dot grid.

**Technique**: Add a `div` that tracks `mousemove` events and applies a `radial-gradient` mask centered on the cursor position. This gradient will be orange, fading out over ~120px, and will only be visible where dots exist (using `mix-blend-mode` or simple overlay opacity).

Since the parent container currently has `pointer-events-none`, we need to enable pointer events on the tracking layer while keeping the rest non-interactive.

## Changes

### `src/components/HeroBackground.tsx`

- Convert from a stateless arrow function to a component with `useState` + `onMouseMove`
- Add a new overlay `div` with `pointer-events-auto` that covers the full hero area and tracks cursor position
- On `mousemove`, update `x, y` state
- Render a second layer beneath the dot grid using a `radial-gradient(circle 120px at {x}px {y}px, hsl(24 95% 53% / 0.25), transparent)` as the background
- This orange glow will shine through the dot grid, making nearby dots appear to light up orange
- On `mouseleave`, hide the glow (set opacity to 0 with a CSS transition)

### Technical Detail

```
Component structure:
- Outer div (absolute inset-0, overflow-hidden)
  - Mouse tracking div (absolute inset-0, pointer-events-auto, z-10)
    -> onMouseMove: update x/y
    -> onMouseLeave: hide glow
  - Orange glow div (absolute inset-0, pointer-events-none)
    -> style: radial-gradient centered at cursor, orange with ~120px radius
    -> transition: opacity 300ms
  - Dot grid div (existing, unchanged)
  - Pulse rings (existing, unchanged)
```

**No new dependencies. No CSS changes needed. Single file modified.**

