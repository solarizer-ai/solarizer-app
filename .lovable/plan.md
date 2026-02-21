

# Fix Hero Text Alignment

## Problem
The two heading lines have different font sizes, so with `text-center`, each line centers independently — creating different left edges. "Reimagined With AI" appears shifted right compared to "Smart Contract Security."

## Solution
Make the `h1` an `inline-block` element with `text-left` alignment. The parent container keeps `text-center`, which centers the `inline-block` h1 as a whole. Inside, both lines left-align to the same edge, forming a clean vertical column.

## Change (`src/pages/Home.tsx`, line 130)

**Before:**
```html
<h1 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.05] tracking-tight">
```

**After:**
```html
<h1 className="inline-block text-left text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.05] tracking-tight">
```

Adding `inline-block text-left` makes the h1 shrink-wrap to the width of "Smart Contract Security" (the longer line), then both lines share the same left edge. The parent's `text-center` keeps the entire block horizontally centered on the page. No other elements are affected — the description paragraph remains independently centered via its own `mx-auto`.

