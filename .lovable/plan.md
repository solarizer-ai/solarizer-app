

# Fix DashboardAuditDemo Mobile View -- CSS Scale Approach

## Problem
On mobile, the demo tries to fit content into a smaller width by cramping elements. Instead, it should render at desktop proportions and scale down visually -- like dragging a window corner to shrink it. All fonts, icons, spacing, and content shrink proportionally.

## Solution
Use CSS `transform: scale()` to render the demo at a fixed desktop size (640x520) and scale it down on smaller screens. Everything -- fonts, icons, padding, findings cards -- shrinks uniformly.

## Changes (single file: `src/components/DashboardAuditDemo.tsx`)

### 1. Add a ResizeObserver-based scale wrapper

- Add a `useRef` on an outer container div and a `ResizeObserver` to measure its width
- Compute `scale = Math.min(containerWidth / 640, 1)` (never scale up beyond 1x)
- Store scale in state

### 2. Structure the wrapper

```text
+--------------------------------------+
| Outer div (width: 100%)              |
| height = 520 * scale (dynamic)       |
| overflow: hidden, position: relative |
|                                      |
|  +--------------------------------+  |
|  | Inner div (fixed 640px x 520px)|  |
|  | transform: scale(X)            |  |
|  | transform-origin: top left     |  |
|  | position: absolute, top: 0     |  |
|  |                                |  |
|  | All content renders at desktop |  |
|  | size -- fonts, icons, spacing  |  |
|  | all shrink via the CSS scale   |  |
|  +--------------------------------+  |
+--------------------------------------+
```

On a 360px phone: scale = 360/640 = 0.5625, so the entire demo (including all text, icons, padding) appears at ~56% of desktop size -- same proportions, just smaller.

### 3. Remove all `sm:` responsive breakpoints inside the component

Since the component always renders at 640px internally, responsive breakpoints are unnecessary. Strip all `sm:` prefixed classes and keep only the desktop variants:

- `p-3 sm:p-5` becomes `p-5`
- `h-[480px] sm:h-[520px]` becomes `h-[520px]` (fixed at desktop height)
- `text-sm sm:text-base` becomes `text-base`
- `text-[10px] sm:text-xs` becomes `text-xs`
- `text-xs sm:text-sm` becomes `text-sm`
- `hidden sm:inline` becomes just present (remove hidden)
- `sm:hidden` elements get removed entirely (mobile-only abbreviations no longer needed)
- `grid grid-cols-3 gap-2 sm:flex sm:flex-wrap` becomes `flex flex-wrap`
- `p-3 sm:p-4` becomes `p-4`
- `px-3 sm:px-4` becomes `px-4`
- `w-3 h-3 sm:w-3.5 sm:h-3.5` becomes `w-3.5 h-3.5`

### 4. Keep the macOS title bar inside the scaled container

The title bar (traffic lights + title) is part of the inner fixed-size div, so it also scales down proportionally with everything else.

### 5. Border radius and shadow stay on the outer wrapper

Move `rounded-xl border border-border bg-card shadow-2xl` to the outer wrapper so they don't get distorted by the scale transform. The inner div gets no border/shadow/rounding.

## Technical Details

- The `ResizeObserver` fires on mount and resize, updating `scale` state
- The outer div uses `style={{ height: 520 * scale }}` for correct document flow
- The inner div uses `style={{ transform: \`scale(${scale})\`, transformOrigin: 'top left', width: 640, height: 520 }}`
- On desktop (width >= 640px), scale = 1, no visual change
- On mobile, everything shrinks uniformly -- no cramped text, no layout breaks

