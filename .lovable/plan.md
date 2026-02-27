

# Redesign Public Report Page to Solarizer Standard

## Overview
Overhaul `PublicReport.tsx` from its current plain layout to a polished, professional design matching the Solarizer aesthetic. Take direct inspiration from `SecurityScoreCard` (circular grade ring, vulnerability matrix bar), `FindingItem` (expandable accordion with sections for description, code, remediation), and `SecurityCoverageTab` (summary cards with colored borders/backgrounds).

## Design Changes

### 1. Hero / Score Section
Replace the flat score card with the **circular SVG grade ring** from `SecurityScoreCard`:
- Animated SVG circle showing score progress with grade letter centered
- Grade-based coloring (green for A/B, amber for C/D, red/purple for F)
- Vulnerability matrix horizontal bar beneath (colored segments per severity)
- Category pills row (Critical, High, Medium, Low, Info, Gas) with icons, counts, and colored backgrounds/borders matching the existing pill design

### 2. Project Metadata Header
- Terminal-style pill label "SECURITY AUDIT REPORT" using `terminal-pill` class
- Project name as `heading-section` with `text-gradient` for the orange gradient
- Metadata row: date, nLOC count, total findings, resolved count -- each with subtle icons
- Separator line using `border-subtle`

### 3. Scope Section
Replace the plain file list with a styled card matching the Coverage tab aesthetic:
- Card with `bg-card border-border` and a subtle `bg-primary/5` header strip
- Files shown as mono-styled rows with alternating subtle backgrounds
- File count badge in the header
- Collapsible if more than 10 files

### 4. Findings Section -- Accordion Style
Replace the flat card list with the **expandable accordion pattern** from `FindingItem`:
- Each finding is a collapsible row: severity badge (colored pill with icon) + title + location + resolved status
- Clicking expands to show:
  - **Description** section with label "DESCRIPTION" (uppercase tracking-wider muted)
  - **Affected Code** section using the existing `CodeBlock` component with Solidity syntax highlighting via the `highlightSolidityCode` function (copied from FindingItem since it's not exported)
  - **Remediation** section in a `bg-success/5 border-success/20` box with lightbulb icon, matching the FindingItem remediation guide styling
  - **Status** indicator: green checkmark "Resolved" or muted "Open"
- Severity group headers with icon, label, and count

### 5. Remediation Summary Widget
Add a mini progress card (like `RemediationProgressWidget`) showing:
- "X of Y findings resolved" with a progress bar
- Percentage text

### 6. Footer
- Solarizer logo with subtle opacity
- "Powered by Solarizer" text
- Disclaimer text
- Copyright line
- Subtle `bg-radial-glow` background effect

### 7. Header Bar
- Sticky header with `backdrop-blur-sm` (keep existing)
- Add subtle bottom glow line using `border-primary/20`

## Technical Details

### File: `src/pages/PublicReport.tsx` (full rewrite)
- Import `Collapsible` / `CollapsibleContent` / `CollapsibleTrigger` from radix
- Import `Progress` component
- Copy the `highlightSolidityCode` function (and keyword/type sets) from `FindingItem.tsx` since it is not exported as a shared utility
- Also copy the `renderWithCodeFormatting` and `parseInlineFormatting` helpers for proper markdown rendering of descriptions and remediation text
- Reuse `CodeBlock` component for code snippets
- Add `useState` for expanded finding tracking (accordion behavior)
- SVG circular progress ring rendered inline (same math as `SecurityScoreCard`)
- Responsive: stacked on mobile, side-by-side on desktop for the score section

### No other files need modification
This is a self-contained redesign of the single page component.

