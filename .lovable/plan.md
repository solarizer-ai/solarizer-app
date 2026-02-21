

# Homepage Visual Fixes

## Summary

Five targeted fixes: orange heading, terminal visibility, phase number removal, text alignment in pipeline, and finding card layout.

## Changes

### 1. Hero heading -- "Security For ALL" in orange (`src/pages/Home.tsx`)

Line 130-134: Change the h1 so "Security For ALL" is wrapped in a `text-primary` span (solar orange), and "Accessible instantly" stays `text-foreground`. Use `whitespace-nowrap` on "Accessible instantly" to prevent wrapping. Remove the `<br />` between them -- use a block-level structure instead:

```
<h1 class="...">
  <span class="text-primary">Security For ALL</span>
  <br />
  <span class="whitespace-nowrap">Accessible Instantly</span>
</h1>
```

### 2. Terminal gradient fix (`src/pages/Home.tsx`)

Line 146: The `h-48 bg-gradient-to-t from-background` overlay is hiding the bottom of the terminal. Remove this div entirely so the terminal is fully visible. Add `pb-16` to the hero section instead for bottom spacing.

### 3. Remove phase numbers (`src/pages/Home.tsx`)

Line 180-182: Delete the `<span>` that renders `phase.num` ("01", "02", etc.) inside the circle marker. The icon already sits in the circle -- just remove the number watermark behind it.

### 4. Fix text alignment for alternating phases (`src/pages/Home.tsx`)

Lines 174-176: The alternating layout (`md:flex-row-reverse md:text-right`) causes the description text to misalign from the heading on right-aligned items. Remove the alternating behavior entirely -- all phases should be left-aligned in a consistent vertical sequence. Remove `isEven` logic and the conditional classes.

Line 190: Remove `max-w-md` from the description paragraph so text flows naturally under the heading.

### 5. Finding card layout -- severity and file on separate lines (`src/pages/Home.tsx`)

Lines 100-106: Currently severity badge and file info are on the same row (`flex items-center justify-between`). Change to a stacked layout:
- Severity badge on its own line
- File path on a separate line below the severity badge
- Use `space-y-2` vertical stack instead of horizontal flex

## Technical Details

**Files modified:** 1 (`src/pages/Home.tsx`)

- Line 126: Change `pb-0` to `pb-16` on hero section, keeping `overflow-hidden`
- Lines 130-134: Restructure h1 with `text-primary` span for "Security For ALL" and `whitespace-nowrap` for "Accessible Instantly"
- Line 146: Delete the gradient overlay div entirely
- Lines 170-176: Remove `isEven` variable and alternating flex-row-reverse classes
- Lines 180-182: Delete the phase number `<span>`
- Line 190: Remove `max-w-md` constraint
- Lines 100-106 (FindingCard): Replace horizontal flex with vertical stack -- severity badge first, file path below

**No new dependencies. No database changes.**
