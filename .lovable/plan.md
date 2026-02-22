

# Mobile Hero Section - Spacious & Premium Redesign

Inspired by OpenAgent's mobile layout, make the Solarizer home page hero feel more spacious, bold, and premium on mobile devices.

## Changes Overview

### 1. Heading & Subheading (No Wrapping)
- Keep `whitespace-nowrap` on both heading lines ("Smart Contract Security" and "Reimagined With AI")
- Keep the existing `clamp` sizing that auto-shrinks to fit without wrapping
- No changes to heading/subheading text behavior

### 2. Larger Mobile Subtitle
- Increase the description paragraph from `text-sm` to `text-base` on mobile for better readability
- Add slightly more line-height for breathing room

### 3. Full-Width CTA Button on Mobile
- Add a prominent full-width "Get Started" button with an arrow icon, positioned between the subtitle and the terminal demo
- Style: full-width on mobile (`w-full`), auto-width on desktop (`sm:w-auto`), using the existing `solarGlow` variant
- Links to `/dashboard`

### 4. More Vertical Spacing
- Increase top padding on mobile hero section (from `pt-24` to `pt-28`)
- Add more gap between subtitle and terminal demo (increase `mt-10` to `mt-14` on mobile)
- Add spacing around the CTA button

## File to Modify

| File | Changes |
|------|---------|
| `src/pages/Home.tsx` | Update subtitle size, add CTA button between subtitle and terminal, adjust vertical spacing |

## Technical Details

- Subtitle: Change from `text-sm md:text-lg` to `text-base md:text-lg`
- CTA: Add a `Link` wrapped `Button` (variant `solarGlow`) between the subtitle `<p>` and the terminal `<div>`, styled with `w-full sm:w-auto` and wrapped in a `div` with `mt-8` for spacing
- Hero section padding: `pt-28 md:pt-40`
- Terminal section top margin: `mt-14 sm:mt-20`

