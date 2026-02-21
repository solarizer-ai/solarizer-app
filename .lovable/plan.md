

# Home Page Facelift

## Summary

A complete visual overhaul of the Solarizer landing page, replacing the current busy layout (orbital rings, grid overlays, glass cards, comparison tables) with four clean sections built on typography, whitespace, and a new animated terminal demo component. Header and Footer get minor polish. Pricing gets small copy and styling tweaks.

## What Changes

### 1. New CSS Utilities (`src/index.css`)

Four new classes added inside the existing `@layer utilities` block:

- **`.terminal-pill`** -- monospace phase label (JetBrains Mono, 0.6rem, uppercase, faint orange border)
- **`.glow-orange-border`** -- double box-shadow for the Pricing Pro card
- **`.terminal-cursor`** -- blinking orange cursor (2px wide, 14px tall, 700ms blink keyframe)
- **`.terminal-spinner`** -- spinning braille characters cycling every 80ms via CSS steps

No existing classes removed.

### 2. New Component (`src/components/TerminalAuditDemo.tsx`)

A self-contained animated terminal that replaces the static hero visual. Features:

- macOS-style window chrome (traffic light dots, title bar)
- Renders a realistic CLI audit progress display with:
  - Section headers (Audit title, Contracts, Findings)
  - 8 phase indicators with checkmark/spinner/pending markers
  - 4 contracts with expandable sub-phase trees
  - Findings grouped by severity with tree connectors
- Automatically cycles through 9 animation frames with realistic timing (1-2.5s per frame)
- Independent spinner animation (80ms tick)
- Live elapsed time counter
- Loops indefinitely with instant reset

### 3. Home Page (`src/pages/Home.tsx`) -- Full Replacement

The entire file is replaced with four sections:

**Section 1 -- Hero**
- Large two-line headline: "Security for all." (orange gradient) + "Accessible instantly." (white)
- Two-line description
- Two CTAs: "Start Auditing" and "See How It Works" (smooth scroll)
- The `TerminalAuditDemo` component with a radial orange glow behind it
- Bottom fade dissolving into the next section

**Section 2 -- Audit Pipeline** (`#pipeline`)
- Five phases listed vertically with a left orange border
- Each phase has a `.terminal-pill` label, bold title, and description paragraph
- No cards, no hover effects, no numbered steps

**Section 3 -- What It Finds**
- Two groups: "Known vulnerability patterns" (3 findings) and "Protocol-specific logic" (2 findings)
- Each finding is a `divide-y` row with severity badge, title, description, and file reference
- Severity badges color-coded (red, orange, yellow)

**Section 4 -- CTA**
- Headline: "Run your first audit."
- npm install box with copy-to-clipboard button
- One "Open Dashboard" button

### 4. Header (`src/components/Header.tsx`) -- Three Edits

- Blur: `backdrop-blur-sm` changed to `backdrop-blur-xl`
- Active nav link: adds a 2px orange underline bar via `after:` pseudo-element
- "Get Started" button: adds `hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]`

### 5. Footer (`src/components/Footer.tsx`) -- Restructured

- Desktop links reorganized into two labeled groups: "Product" (Pricing, Docs, Dashboard) and "Legal" (Privacy, Terms)
- Copyright simplified: "2026 Eryonix Techlabs. All rights reserved."
- Tagline: "Enterprise-grade smart contract security. For everyone."
- Mobile copyright simplified

### 6. Pricing (`src/pages/Pricing.tsx`) -- Four Small Edits

- Hero headline: "Flexible Audit Pricing" changed to "Audit-as-you-go pricing."
- Hero subtitle updated to "50 credits included every month. Never expire, never reset."
- Pro card: `shadow-lg shadow-primary/20` replaced with `glow-orange-border`
- Credit explainer line added below pricing cards grid

## Technical Details

**Files created:** 1
- `src/components/TerminalAuditDemo.tsx` -- ~350 lines, self-contained React component with useState/useEffect for animation

**Files modified:** 5
- `src/index.css` -- 4 new utility classes + 1 keyframe
- `src/pages/Home.tsx` -- full rewrite (~280 lines)
- `src/components/Header.tsx` -- 3 line-level edits
- `src/components/Footer.tsx` -- restructured links and copy
- `src/pages/Pricing.tsx` -- 4 targeted edits

**No new dependencies.** All imports are already available in the project.

**No database or backend changes.**

