

# Home Page Polish: Header, Copy, and Mobile Spacing

## 1. Header Glass Effect (`src/components/Header.tsx`)

**Line 65**: Update the header container classes:
- Remove the orange border (`border border-primary/40`) and replace with a subtle white/grey border (`border border-white/10`)
- Increase glass effect by changing `bg-black/60` to `bg-black/70 backdrop-blur-2xl`

## 2. Phase Description Update (`src/pages/Home.tsx`)

**Line 24-25**: Replace the DNA Matching phase description:
- From: "Functions deconstructed into semantic queries against a vector index of exploit signatures from real post-mortems"
- To: "Contract logic matched against a massive database of exploit signatures from real post-mortems"

## 3. "Finds what matters" Section Rename (`src/pages/Home.tsx`)

**Lines 199-204**: Update heading and description:
- Heading: "Finds what matters" -> "Intelligence Engine"
- Description: "Known vulnerability classes and the logic issues specific to your protocol" -> "Solarizer finds known vulnerability classes and the logic issues specific to your protocol"

## 4. Mobile Spacing and Padding Adjustments (`src/pages/Home.tsx`)

Tighten padding and spacing across all sections for a cleaner mobile layout:

- **Hero section** (line 126): Reduce top padding on mobile from `pt-20` to `pt-16`, bottom from `pb-12` to `pb-8`
- **Terminal demo wrapper** (line 142): Reduce mobile top margin from `mt-10` to `mt-8`
- **Pipeline section** (line 150): Reduce mobile padding from `py-24` to `py-16`
- **Pipeline inner spacing** (line 162): Reduce top margin from `mt-16` to `mt-10 md:mt-16`
- **Pipeline items** (line 166): Tighten spacing from `space-y-10` to `space-y-6 md:space-y-10`
- **Pipeline items gap** (line 172): Reduce mobile gap from `gap-6` to `gap-4 md:gap-8`
- **Findings section** (line 196): Reduce mobile padding from `py-20` to `py-16`
- **Findings top group** (line 208): Reduce mobile top margin from `mt-14` to `mt-10 md:mt-14`, padding from `p-6` to `p-4 md:p-8`
- **Findings bottom group** (line 225): Reduce padding from `p-6` to `p-4 md:p-8`
- **CTA section** (line 249): Reduce mobile padding from `py-20` to `py-16`
- **FindingCard** (line 100): Adjust padding from `p-4 sm:p-6` to `p-3 sm:p-6`

### Technical Details

All changes are in two files:
- `src/components/Header.tsx` line 65: border and backdrop classes
- `src/pages/Home.tsx`: copy updates on lines 24-25, 199-204; spacing adjustments across multiple section containers and inner elements
