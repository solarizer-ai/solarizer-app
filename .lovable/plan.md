

# Homepage Content & Layout Updates

## Changes Summary

### 1. Hero Subtext Update (Section 1)
- Replace "Multi-phase AI security analysis for Solidity smart contracts. Find what matters. Ship with confidence."
- New copy: "Detect real exploit paths in minutes -- not weeks. Trace cross-contract attack flows and receive line-accurate fixes."
- Add trust microtext below: "CLI-first . Works locally . No upload required" (small, muted text)

### 2. Reorder Sections: Move Findings Above Pipeline
- Current order: Hero -> Pipeline ("Context-Aware Analysis") -> Findings ("Intelligence Engine") -> Robust Security -> CTA
- New order: Hero -> Findings -> Pipeline (renamed) -> Robust Security (updated) -> CTA

### 3. Findings Section Updates (moved to position 2)
- Remove the "Intelligence Engine" heading and its subtitle
- Replace with: "From **known exploits** to **protocol specific logic**" -- with gradient applied to "known exploits" and "protocol specific logic" (using the `.text-gradient` class)
- Keep the two finding groups (known + protocol-specific) and their cards as-is

### 4. Pipeline Section Rename (now position 3)
- Change heading from "Context-Aware Analysis" to "Intelligence Engine"
- Keep subtitle and phases content unchanged

### 5. Robust Security Section Updates (position 4)
- Change title from "Robust Security" to "Security Infrastructure, Not a Wrapper"
- Remove the subtitle ("Not just another GPT-Wrapper")
- Remove "Isolated Analysis" card (Lock icon) and "AI-Validated Findings" card (CheckCircle2 icon) from `securityFeatures` array
- In "Structured, Not Random" card, remove the last sentence: "Reproducible, auditable results every time."
- Remaining 4 cards: Agentic Red Team, Your Code Stays Yours, Structured Not Random (trimmed), Zero-Trust by Default

### 6. CTA Section Title Change (position 5)
- Change from "Secure your contracts / from your terminal" to "One Command / Instant Security"
- Keep the rest (install command box, View documentation link) unchanged

## Technical Details

All changes are in `src/pages/Home.tsx` only. No new files needed.

- Remove `Lock` and `CheckCircle2` from lucide-react imports
- Remove "Isolated Analysis" and "AI-Validated Findings" objects from `securityFeatures` array
- Trim "Structured, Not Random" description to end after "Checkpoint and resume without losing progress."
- Reorder JSX sections (cut/paste the findings section above the pipeline section)
- Findings heading uses inline gradient spans instead of a plain `<h2>`

