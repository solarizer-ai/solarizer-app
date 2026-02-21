

# Muted Grey Theme + Remove Light Mode

## Summary

Shift the colour palette from pure black backgrounds (2-4% lightness) to a softer muted grey (8-14% lightness), keeping all orange accents untouched. Remove the light theme entirely -- no toggle, no `.light` CSS block, no ThemeProvider complexity.

## What Changes

### 1. Updated colour tokens (`src/index.css`)

The `:root` variables shift from near-black to muted grey:

| Token | Current | New |
|-------|---------|-----|
| `--background` | `0 0% 2%` | `0 0% 9%` |
| `--card` | `0 0% 4%` | `0 0% 12%` |
| `--popover` | `0 0% 4%` | `0 0% 12%` |
| `--secondary` | `0 0% 10%` | `0 0% 16%` |
| `--muted` | `0 0% 10%` | `0 0% 16%` |
| `--muted-foreground` | `0 0% 55%` | `0 0% 60%` |
| `--border` | `0 0% 14%` | `0 0% 20%` |
| `--input` | `0 0% 10%` | `0 0% 16%` |
| `--surface-elevated` | `0 0% 6%` | `0 0% 14%` |
| `--surface-overlay` | `0 0% 8%` | `0 0% 16%` |
| `--border-subtle` | `0 0% 12%` | `0 0% 18%` |
| `--sidebar-background` | `0 0% 2%` | `0 0% 9%` |
| `--sidebar-accent` | `0 0% 10%` | `0 0% 16%` |
| `--sidebar-border` | `0 0% 12%` | `0 0% 18%` |

All orange/primary values stay exactly the same. Foreground text stays `0 0% 98%`.

Delete the entire `.light { ... }` block (lines 73-129) and the `.dark { ... }` block (lines 131-159) since `:root` now serves as the single theme.

### 2. Remove ThemeProvider (`src/hooks/useTheme.tsx`)

Simplify to just always apply "dark" class (needed for Tailwind's `darkMode: ["class"]` to work). Remove toggle/setState logic. Export a minimal hook that returns `theme: "dark"` as a static value so existing consumers (like Sonner) don't break.

### 3. Remove ThemeToggle button

- Delete `src/components/ThemeToggle.tsx` (no longer needed)
- Remove the `<ThemeToggle />` import and usage from `src/components/Header.tsx`

### 4. Update Sonner (`src/components/ui/sonner.tsx`)

The Sonner toaster currently reads `theme` from useTheme. It will continue to work since useTheme still returns `"dark"` -- no code change needed there.

## Technical Details

**Files modified:** 3
- `src/index.css` -- update `:root` values to muted grey, delete `.light` and `.dark` blocks
- `src/hooks/useTheme.tsx` -- simplify to static dark-only provider
- `src/components/Header.tsx` -- remove ThemeToggle import and usage

**Files deleted:** 1
- `src/components/ThemeToggle.tsx`

**No new dependencies. No database changes.**

