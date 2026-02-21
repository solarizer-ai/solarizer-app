

# Fix Hero Heading Centering on Large Viewports

## Problem
The `whitespace-nowrap` headings ("Smart Contract Security" and "Reimagined With AI") are wider than the `max-w-4xl` (896px) container at large font sizes. Since the text overflows to the right, it appears left-aligned even though `text-center` is set.

## Solution
Make the `h1` element shrink-wrap to its content width using `w-fit mx-auto`, so it sizes to the text and gets centered by `mx-auto` regardless of the parent container width. This works at all viewport sizes.

## Changes (src/pages/Home.tsx)

**Line 136** -- Add `w-fit mx-auto` to the h1 so it centers based on its own content width:
```
Before: <h1 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.15] tracking-tight">
After:  <h1 className="w-fit mx-auto text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.15] tracking-tight">
```

This single change ensures the heading block is always perfectly centered at every viewport width -- from 375px mobile to ultrawide desktop.
