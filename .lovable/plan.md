

# Redesign Free Trial CTA on Pricing Page

## Current State
The trial CTA has a title, subtitle with credits info, and two bare social icons with no context. Users won't know what the icons are for.

## Proposed Design
A cleaner, more intentional layout:

```text
┌─────────────────────────────────────────────┐
│          ✦  Try Solarizer Free              │
│   14 days · 300 credits · Full access       │
│                                             │
│       Request access to get started         │
│           [Telegram]   [X/Twitter]          │
└─────────────────────────────────────────────┘
```

### Changes to `src/pages/Pricing.tsx` (lines 379-414)

Replace the current trial banner with a refined version:

- **Accent icon**: Replace generic layout with a small `Sparkles` icon (from lucide) next to the title for a premium feel
- **Title**: "Try Solarizer Free" — slightly larger, `text-base font-semibold`
- **Subtitle**: "14 days · 300 credits · Full Inferno-tier access" — keep as `text-xs text-muted-foreground/60`
- **Helper text**: Add `"Request access to get started"` in `text-xs text-muted-foreground/40` above the icons
- **Icons**: Keep the Telegram and X icons but wrap each in a subtle pill-shaped hover target (`rounded-full border border-primary/10 p-2 hover:bg-primary/10 transition-all`) for better affordance
- **Spacing**: Tighten vertical gaps (`gap-1` between title/subtitle, `mt-3` before helper text, `mt-2` before icons)

Single file edit, ~30 lines replaced.

