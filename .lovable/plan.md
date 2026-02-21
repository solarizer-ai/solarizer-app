

# Glass Pill Header and Minimal Footer

## Summary

Redesign the Header as a floating glass pill (inspired by open-agent.io) and simplify the Footer to a single-line minimal bar.

## Changes

### 1. Header (`src/components/Header.tsx`) -- Floating Glass Pill

Replace the full-width sticky header with a floating, centered pill shape:

**Outer wrapper**: Instead of a full-width `border-b` header, use a fixed-position container with `top-4` padding, centered horizontally with `left-1/2 -translate-x-1/2`, `max-w-2xl w-[calc(100%-2rem)]`. The pill itself gets:
- `rounded-full` for the pill shape
- `bg-background/60 backdrop-blur-xl` for glass effect
- `border border-white/[0.08]` for a very subtle edge
- `shadow-[0_0_30px_rgba(0,0,0,0.3)]` for depth
- `px-4 h-12` for compact sizing (shorter than current 16/64px)

**Layout inside the pill**:
- Left: Logo (smaller, `w-8 h-8`) + "Solarizer" text label in `text-sm font-medium`
- Center: Nav links inline with tighter `gap-6`, smaller `text-[13px]`, no active underline (active state is just `text-foreground font-medium` vs `text-muted-foreground/60`)
- Right: When logged out, a single compact "Get Started" button with `rounded-full bg-primary text-primary-foreground text-xs px-4 py-1.5`. When logged in, the avatar circle. ThemeToggle stays but gets smaller.

**Mobile**: On `md:hidden`, the pill shrinks to just logo + hamburger menu. The Sheet side panel stays the same.

**Page content offset**: Since the header is now floating (not in document flow), add `pt-20` to the first section of pages that use the Header, or wrap in a spacer. The hero section in `Home.tsx` already has `pt-32` so it should be fine. Other pages may need a small top-padding bump.

### 2. Footer (`src/components/Footer.tsx`) -- Single-Line Minimal

Replace the two-row footer with a single centered line:

**Desktop**: A single row, centered, with just:
- `text-xs text-muted-foreground/40` copyright: "2026 Eryonix Techlabs"
- A centered dot separator
- Inline links: Pricing, Docs, Privacy, Terms -- all `text-xs text-muted-foreground/40 hover:text-muted-foreground`

No logo in the footer. No tagline. No border-t. No column groups. Just one clean line with generous vertical padding (`py-8`).

**Mobile**: Same single line but links wrap naturally. Or stack as: links on one line, copyright below.

### 3. Home page spacing (`src/pages/Home.tsx`)

The hero already has `pt-32 md:pt-44` which provides enough clearance for the floating header. No changes needed here.

## Technical Details

**Files modified:** 2

**`src/components/Header.tsx`**:
- Replace the outer `<header>` element: remove `border-b`, change to `fixed top-4 left-1/2 -translate-x-1/2 z-[60]` with `max-w-2xl w-[calc(100%-2rem)]`
- Inner container: `rounded-full bg-background/60 backdrop-blur-xl border border-white/[0.08] shadow-[0_0_30px_rgba(0,0,0,0.3)] px-4 h-12`
- Add "Solarizer" text next to logo
- Simplify nav link styles (remove `after:` underline, use opacity-based active state)
- Make "Get Started" button `rounded-full` with smaller sizing
- Keep all existing logic (auth, profile fetch, mobile sheet) unchanged

**`src/components/Footer.tsx`**:
- Replace entire JSX with a single `<footer>` containing one centered flex row
- Remove logo, column groups, tagline, border-t
- Single line: copyright + dot separators + inline links
- All text in `text-xs text-muted-foreground/40`

**No new dependencies. No database changes.**

