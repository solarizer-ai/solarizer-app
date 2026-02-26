

# Upgrade Insights and Invariants Tab UI/UX

## Goal
Bring the Insights and Invariants tabs up to the same visual quality as the Coverage tab by adding summary cards with stats, colored indicators, progress-like visuals, and better card styling.

## Changes

### 1. InsightsTab.tsx -- Full visual upgrade

**Summary card at top** (matching Coverage's summary card pattern):
- Large icon in a colored circle (Lightbulb) with the total insight count
- Three stat pills showing counts per category: Weak Points, Feature Suggestions, Architecture Improvements
- Each pill color-coded (red for weak points, amber for suggestions, blue/teal for architecture)

**Improved section headers**:
- Add a colored left-border accent line to each category section header
- Category icon gets a matching background circle (like Coverage's shield icon)

**Upgraded InsightCard**:
- Add a colored left border strip based on priority (red=high, amber=medium, green=low)
- Add a small category icon in the top-left of each card
- Better visual hierarchy: title bolder, description with more breathing room
- Affected contracts pills get a subtle colored background matching the category

### 2. InvariantsTab.tsx -- Full visual upgrade

**Summary card at top** (matching Coverage pattern):
- Shield icon in a colored circle with total invariant count displayed large
- Progress-style indicator showing CRITICAL vs HIGH ratio
- Stats row: X critical, Y high, Z contract-scope, W cross-contract

**Improved section headers**:
- Add Shield icon with colored background for contract vs cross-contract sections
- Color-coded: contract section uses a neutral/blue tone, cross-contract uses orange/warning tone

**Upgraded InvariantCard**:
- Add a colored left border strip (red for CRITICAL, orange for HIGH)
- Add a small scope indicator badge (contract / cross-contract) alongside the severity badge
- Better typography: description text slightly larger, contracts list more visually distinct

## Technical Details

### Files modified
- `src/components/InsightsTab.tsx` -- rewrite component with summary card, improved section headers, enhanced cards with left border accents
- `src/components/InvariantsTab.tsx` -- rewrite component with summary card showing severity distribution, progress indicator, enhanced cards with left border accents

### Patterns reused from Coverage
- Summary card with `p-4 md:p-6 rounded-lg border` + colored bg/border
- Large icon in a round container
- Stats row with inline icon + count pairs
- Color-coded sections (success/destructive/warning palette)

### No new dependencies needed
All styling uses existing Tailwind classes, lucide-react icons, and existing UI components (Badge, Collapsible, Progress).

