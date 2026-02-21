

# Fix Dot Glow, Heading Size, and Mobile Compatibility

## 1. Dot-only orange glow (`src/components/HeroBackground.tsx` + `src/index.css`)

Replace the current radial gradient blob with a masked orange dot grid so only the dots themselves glow orange near the cursor.

- Add a new CSS class `.hero-dot-grid-orange` in `src/index.css` identical to `.hero-dot-grid` but using `hsl(24 95% 53% / 0.7)` for the dot color
- In `HeroBackground.tsx`, replace the orange gradient `div` with a new `div` that uses the `hero-dot-grid-orange` class
- Apply a CSS `mask-image` / `-webkit-mask-image` of `radial-gradient(circle 150px at {x}px {y}px, black, transparent)` so only dots near the cursor show the orange color
- Keep the same mouse tracking logic and opacity transition

## 2. Smaller "Accessible Instantly" heading (`src/pages/Home.tsx`)

Line 133: Add a smaller clamp size to the "Accessible Instantly" span: `text-[clamp(1.8rem,4.5vw,4rem)]` while the parent h1 retains `text-[clamp(2.4rem,6vw,5.5rem)]` for "Security For ALL".

## 3. Mobile-responsive terminal (`src/components/TerminalAuditDemo.tsx`)

- Change the fixed `h-[480px]` on the terminal body to `h-[360px] sm:h-[420px] md:h-[480px]` so it shrinks on small screens
- Reduce font size on mobile: change `text-[11px] sm:text-[12px] md:text-[13px]` to `text-[9px] sm:text-[11px] md:text-[13px]`
- Reduce padding on mobile: change `p-4 sm:p-5` to `p-3 sm:p-4 md:p-5`
- Reduce sub-phase indent from `ml-8` to `ml-4 sm:ml-8` so tree lines don't overflow

## 4. Mobile-responsive Home page (`src/pages/Home.tsx`)

- Hero top padding: change `pt-24 pb-16 md:pt-36` to `pt-20 pb-12 md:pt-36 md:pb-16`
- Hero heading container: change `px-6` to `px-4 sm:px-6`
- Terminal wrapper: change `mt-16` to `mt-10 sm:mt-16`
- Pipeline section spacing: reduce `py-24 md:py-32` -- keep as-is (already responsive)
- Finding card padding: change `p-6` to `p-4 sm:p-6` for tighter mobile layout
- CTA install command: change `px-6 py-4` to `px-4 py-3 sm:px-6 sm:py-4` and font to `text-xs sm:text-sm`

## Technical Details

**Files modified:** 3

- `src/index.css` -- Add `.hero-dot-grid-orange` class
- `src/components/HeroBackground.tsx` -- Replace blob gradient with masked orange dot grid
- `src/components/TerminalAuditDemo.tsx` -- Responsive height, font, padding, and indent
- `src/pages/Home.tsx` -- Smaller "Accessible Instantly" font + mobile spacing tweaks

