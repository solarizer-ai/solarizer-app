
# Home Page Visual Fixes

Four targeted fixes in `src/pages/Home.tsx`.

## Fix 1 -- Pipeline Line Overshoots Last Icon (lines 470-498)

Remove the two absolute line divs (lines 471-475) that span the full container height. Replace with per-step connector lines rendered inside the `phases.map()` loop:

- Each phase (except the last) renders a dashed background connector and an active fill overlay
- Lines start at icon center (`top-6 md:top-8`) and span to the next icon (`h-[calc(100%+1.25rem)] md:h-[calc(100%+2rem)]`)
- The active fill uses the existing `isActive` threshold check
- Last phase renders no connector, so the line stops at the last icon center

## Fix 2 -- Hero Headline Asymmetry (lines 288-291)

Remove `w-fit` from the `h1` and `whitespace-nowrap` + `block` from both spans. Use `text-center` on the h1 and a `<br />` between lines so each line sits centered at its natural width.

```
Before: <h1 className="w-fit mx-auto ...">
After:  <h1 className="mx-auto ... text-center">
```

## Fix 3 -- Finding Cards Inconsistent Heights (lines 159-160, 430, 450)

- Add `flex flex-col h-full` to the FindingCard root div
- Add `items-stretch` to both finding card grids (lines 430, 450)

## Fix 4 -- Remove CLI References (lines 143-148, 223-242)

- Change enterprise feature title from "Dashboard + CLI" to "Web Dashboard"
- Update description to remove terminal/CLI mention
- Replace `InterfacesIllustration` two-column grid (Dashboard + CLI panels) with a single full-width dashboard panel

## Technical Details

All changes are in `src/pages/Home.tsx`. No new dependencies or files needed.
