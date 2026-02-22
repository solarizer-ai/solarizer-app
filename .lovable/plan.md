

# Solarizer Homepage Rebuild — 9-Section Layout

## Overview
Complete rebuild of `src/pages/Home.tsx` from the current 5-section layout to a 9-section conversion-optimized layout. Reuses existing components (`Header`, `Footer`, `TerminalAuditDemo`, `HeroBackground`) and creates 6 new section components.

## What Changes

### Remove from Home.tsx
- `phases` array (5-phase pipeline data)
- `protocolFindings` array
- `securityFeatures` array
- Old sections: Audit Pipeline, Intelligence Engine (two-group findings), Robust Security grid, old CTA
- Install command changes from `npm install -g solarizer` to `curl -fsSL https://solarizer.io/install.sh | bash`

### Keep from Home.tsx
- `knownFindings` array (renamed to `findings`, titles slightly adjusted per spec)
- `FindingCard` component (updated styling for left border + spec-compliant padding/radius)
- `severityBorder` map

### New Section Order
1. **Hero** -- Two-column (desktop), stacked (mobile). Headline + subtext + two buttons + trust microtext on left, terminal on right. Min-height 92vh.
2. **Real Findings** -- "See what Solarizer actually detects". 3 stacked finding cards with severity-colored left border.
3. **Differentiator Comparison** -- "Most scanners check contracts. Solarizer models the entire protocol." Two-card side-by-side (desktop), stacked (mobile).
4. **How It Works** -- "From install to report in one command". 4 numbered steps with code blocks for steps 1-2.
5. **Speed Positioning** -- "Run Solarizer before your manual audit". Two-list comparison.
6. **Engine Explanation** -- "Five phases. One command." 5 feature cards in 2-col grid (desktop).
7. **Trust Signals** -- 3 metric items in a row.
8. **CLI Install** -- "Secure your contracts from your terminal" + curl command + View Docs link.
9. **Final CTA** -- "Don't ship exploitable contracts." + "Scan Your Protocol Now" button + microtext.

## Files to Create

### `src/components/home/RealFindings.tsx`
- 3 stacked finding cards (CRITICAL, HIGH, MEDIUM)
- Severity badge ABOVE vulnerability name (never side-by-side)
- Left border color matching severity
- Card padding: 28px desktop / 20px mobile, border-radius: 16px / 14px, gap: 22px / 16px

### `src/components/home/DifferentiatorComparison.tsx`
- Two cards side-by-side at md+, stacked on mobile
- Traditional scanners: dimmed styling with cross marks
- Solarizer: brighter bg, subtle orange border, checkmarks

### `src/components/home/HowItWorks.tsx`
- 4 numbered steps with connecting line
- Steps 1-2: terminal-style code blocks (monospace)
- Steps 3-4: descriptive text

### `src/components/home/SpeedPositioning.tsx`
- Two-list comparison: Manual Audit vs Solarizer
- Checkmarks for Solarizer, crosses for manual audit drawbacks

### `src/components/home/EngineExplanation.tsx`
- 5 feature cards: Complexity Analysis, Exploit Pattern Matching, Red-Team Simulation, Cross-Contract Tracing, Line-Accurate Remediation
- 2-column grid on desktop, single column on mobile

### `src/components/home/TrustSignals.tsx`
- 3 metric items in a row (desktop) or stacked (mobile)
- "Detects dozens of vulnerability classes", "Tested against historical exploit datasets", "Designed for production Solidity protocols"

## Files to Modify

### `src/pages/Home.tsx` (major rewrite)
- Remove old data arrays (`phases`, `protocolFindings`, `securityFeatures`)
- Update `findings` data with spec-compliant titles
- Hero becomes two-column layout with 92vh min-height
- Two CTA buttons: "Scan Your Protocol Now" (primary, links to /dashboard) and "View Documentation" (outline, links to /docs)
- Trust microtext: "CLI-first . Works locally . No upload required"
- "Real Solarizer output" label above terminal
- Import and render all 9 sections in order
- Install command: `curl -fsSL https://solarizer.io/install.sh | bash`
- Section spacing: `py-[140px]` desktop, responsive down to `py-[70px]` mobile

## Technical Details

### Spacing System
- Section vertical padding: 140px desktop, 110px laptop (lg), 90px tablet (md), 70px mobile
- Tailwind classes: `py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]`
- Horizontal padding: `px-5 md:px-8 lg:px-12 xl:px-20`
- Container max-width: `max-w-[1280px] mx-auto`

### Hero Layout
- Desktop (lg+): CSS grid `grid-cols-2`, left column for copy, right for terminal
- Terminal height: `h-[260px] sm:h-[300px] md:h-[420px] lg:h-[460px]`
- Buttons: 48-52px height, "Scan Your Protocol Now" (primary solid) + "View Documentation" (outline/solarGlow)
- Mobile: stacked vertically, buttons full-width and stacked

### Finding Card Updates
- Add left border (`border-l-2` or `border-l-[3px]`) colored by severity
- Padding: `p-5 md:p-7` (20px mobile, 28px desktop)
- Border-radius: `rounded-[14px] md:rounded-[16px]`

### Responsive Rules
- All section headings: `text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]`
- Mobile hero headline: ~28px (handled by clamp)
- Mobile buttons: stacked vertically, 52px height, full width

### No New Dependencies Required
All built with existing Tailwind, lucide-react icons, and shadcn/ui Button component.
