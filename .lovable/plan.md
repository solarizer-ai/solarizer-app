
# Tighten Spacing & Polish for Continuous Flow

## Philosophy
Reduce inter-section gaps so the page reads as one seamless narrative scroll rather than isolated blocks. Also apply small senior-level polish tweaks: softer transitions between sections, consistent rhythm, and removing redundant `bg-background` declarations.

## Changes (all in `src/pages/Home.tsx`)

### 1. Reduce Section Padding
| Section | Current | New |
|---------|---------|-----|
| Hero (bottom) | `pb-12 md:pb-20` | `pb-8 md:pb-14` |
| Pipeline | `py-16 md:py-32` | `py-10 md:py-20` |
| Intelligence Engine | `py-16 md:py-28` | `py-10 md:py-20` |
| CTA | `py-16 md:py-28` | `py-12 md:py-24` |

### 2. Tighten Internal Spacing
- Pipeline heading-to-timeline gap: `mt-10 md:mt-16` becomes `mt-8 md:mt-12`
- Intelligence Engine heading-to-cards gap: `mt-10 md:mt-14` becomes `mt-8 md:mt-10`
- Pipeline phase items: `space-y-6 md:space-y-10` becomes `space-y-5 md:space-y-8`

### 3. Remove Redundant `bg-background`
All three body sections (Pipeline, Intelligence Engine, CTA) repeat `bg-background` which is already set on the page wrapper. Removing these creates a cleaner codebase and ensures the sections feel visually unified rather than stacked.

### 4. Terminal Top Margin
Reduce `mt-14 sm:mt-20` to `mt-10 sm:mt-16` so the terminal sits closer to the subtitle.

## No other files modified
