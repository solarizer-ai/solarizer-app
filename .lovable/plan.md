

## Fix: Headline overlapping terminal

The `whitespace-nowrap` + `w-fit` on the h1 causes it to expand beyond the left grid column and overlap with the terminal on the right.

**Solution**: Remove `w-fit` from the h1 (so it stays within its grid column) and reduce the max clamp font size from `5.5rem` to `3.8rem` so both lines fit on one line within a 50% column width without overflowing. On very large screens, `3.8rem` is still large and impactful. The clamp becomes `clamp(1.6rem, 4vw, 3.8rem)`.

### Changes in `src/pages/Home.tsx` (line 39)

- Remove `w-fit` from h1
- Change `text-[clamp(1.6rem,5vw,5.5rem)]` to `text-[clamp(1.6rem,4vw,3.8rem)]`
- Keep `whitespace-nowrap` on both spans so text never wraps

This ensures the headline stays within the left column and never overlaps the terminal.
