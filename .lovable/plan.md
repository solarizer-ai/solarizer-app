
# Fix "Reimagined With AI" Text Getting Cut Off

## Problem
At certain viewport widths, the heading "Reimagined With AI" overflows the `max-w-3xl` container. Because the parent section has `overflow-hidden`, the "AI" part gets clipped and disappears.

## Solution
Remove `overflow-hidden` from the hero section so text is never clipped. The HeroBackground component handles its own overflow internally, so this is safe. Additionally, widen the hero container from `max-w-3xl` to `max-w-4xl` to give the headings more room.

## Changes (src/pages/Home.tsx)

**Line 132** -- Remove `overflow-hidden` from the hero section:
```
Before: <section className="relative overflow-hidden pt-24 pb-12 md:pt-40 md:pb-20">
After:  <section className="relative pt-24 pb-12 md:pt-40 md:pb-20">
```

**Line 135** -- Widen the text container:
```
Before: <div className="relative max-w-3xl mx-auto text-center px-4 sm:px-6">
After:  <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6">
```

These two small changes ensure the heading text is never clipped at any viewport width.
