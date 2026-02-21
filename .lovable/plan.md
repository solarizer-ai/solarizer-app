

# Homepage Fixes: Terminal, Theme, Dots, Findings Layout

## 1. Fix terminal animation stuck on Cross-Contract (`src/components/TerminalAuditDemo.tsx`)

The animation has 9 frames (0-8) but stops at frame 8 with Cross-Contract active. Need to add frames 9-12 to complete the remaining phases (Validation, QA Scan, Formatting, Report Generation) and show a final "complete" state.

- Add frames 9-12 to `buildFrame()` to progress through phases 4-7 (Validation, QA Scan, Formatting, Report Generation) marking each done
- Add corresponding delays to `FRAME_DELAYS` array (4 more entries)
- Update the `frame >= 8` guard in useEffect hooks to `frame >= 12`
- Frame 9: Cross-Contract done, Validation active
- Frame 10: Validation done, QA Scan active  
- Frame 11: QA Scan done, Formatting active, then Formatting done, Report Generation active
- Frame 12: All phases done, show a completion line "Audit complete -- report saved"

## 2. Switch back to black theme (`src/index.css`)

Revert the muted grey tokens back to near-black:

| Token | Current (grey) | New (black) |
|-------|---------------|-------------|
| `--background` | `0 0% 9%` | `0 0% 3%` |
| `--card` | `0 0% 12%` | `0 0% 6%` |
| `--popover` | `0 0% 12%` | `0 0% 6%` |
| `--secondary` | `0 0% 16%` | `0 0% 10%` |
| `--muted` | `0 0% 16%` | `0 0% 10%` |
| `--border` | `0 0% 20%` | `0 0% 14%` |
| `--input` | `0 0% 16%` | `0 0% 10%` |
| `--surface-elevated` | `0 0% 14%` | `0 0% 8%` |
| `--surface-overlay` | `0 0% 16%` | `0 0% 10%` |
| `--border-subtle` | `0 0% 18%` | `0 0% 12%` |
| `--sidebar-background` | `0 0% 9%` | `0 0% 3%` |
| `--sidebar-accent` | `0 0% 16%` | `0 0% 10%` |
| `--sidebar-border` | `0 0% 18%` | `0 0% 12%` |

## 3. Make hero dot animation visible (`src/components/HeroBackground.tsx` + `src/index.css`)

- Increase dot grid opacity from `opacity-20` to `opacity-40`
- Increase dot size in CSS from `0.15` alpha to `0.25` alpha and dot radius from 1px to 1.5px
- Increase pulse ring border opacity from `0.03` / `0.02` / `0.015` to `0.06` / `0.05` / `0.04` / `0.03`

## 4. Stack findings vertically (`src/pages/Home.tsx`)

- Known findings: Change `grid grid-cols-1 md:grid-cols-3` to `grid grid-cols-1` (line 217)
- Protocol findings: Change `grid grid-cols-1 md:grid-cols-2` to `grid grid-cols-1` (line 239)

## Technical Details

**Files modified:** 4

- `src/components/TerminalAuditDemo.tsx` -- Add frames 9-12 to complete all phases, update guards
- `src/index.css` -- Revert all background/surface/border tokens to near-black values
- `src/components/HeroBackground.tsx` -- Increase opacity on dot grid and pulse rings
- `src/pages/Home.tsx` -- Change finding grids from multi-column to single column
