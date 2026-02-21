
# Change Header to White Glass

The current header uses "black glass" (a dark, semi-transparent background derived from the app's obsidian theme). We will switch it to "white glass" by adjusting the background color, border, and internal text contrast to achieve a frosted glass effect that stands out against the dark background.

## Proposed Changes

### 1. Update Header Container (`src/components/Header.tsx`)
- Change the background from `bg-background/60` (dark) to `bg-white/10` or `bg-white/15` to create a light "frosted" base.
- Increase the border opacity from `border-white/[0.08]` to `border-white/20` to define the pill shape more clearly as a light object.
- Adjust the shadow to be more subtle or light-themed if necessary (though the dark shadow usually works well for depth on dark backgrounds).

### 2. Refine Header Text and UI Contrast
- Since the base is becoming lighter, we will ensure all text remains readable.
- The "Solarizer" brand name and navigation links currently use `text-foreground` (white) and `text-muted-foreground/60`. These will be kept white or slightly adjusted to maintain crispness against the frosted background.
- If we go with a very light/opaque white glass (e.g., `bg-white/80`), we will switch the text colors to dark (e.g., `text-zinc-900`) for accessibility. Based on the "Obsidian" theme, a "frosted light" look (`bg-white/15`) is typically preferred to maintain the futuristic vibe without breaking the dark theme entirely.

## Technical Details
- **Background**: Replace `bg-background/60` with `bg-white/15`.
- **Blur**: Keep `backdrop-blur-xl` as it's essential for the glass effect.
- **Border**: Change `border-white/[0.08]` to `border-white/20`.
- **Text**: No major changes needed if using `bg-white/15`, but we will verify contrast.

