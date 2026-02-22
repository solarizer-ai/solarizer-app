

# Add "Robust Security" Section to Home Page

## Overview
Add a new section between the Intelligence Engine section and the CTA section on the home page, showcasing Solarizer's security guarantees with 6 feature cards in a 2-column grid.

## Changes

### `src/pages/Home.tsx`

**1. Add new icon imports** to the existing lucide-react import:
- `Shield`, `Lock`, `EyeOff`, `CheckCircle2`, `Workflow`, `KeyRound`

**2. Add `securityFeatures` data array** after `protocolFindings` and before `severityBorder`:
- Agentic Red Team (Shield)
- Isolated Analysis (Lock)
- Your Code Stays Yours (EyeOff)
- AI-Validated Findings (CheckCircle2)
- Structured, Not Random (Workflow)
- Zero-Trust by Default (KeyRound)

**3. Add new section in JSX** between Section 3 (Intelligence Engine) and the CTA:
- Section header: "Robust Security" / "Not just another GPT-Wrapper"
- 2-column responsive grid (`grid-cols-1 md:grid-cols-2`) with 6 cards
- Each card: icon, title, description
- Matches existing design system (same card styling as Intelligence Engine)

**4. Renumber section comments**: CTA becomes Section 5.

## Technical Details
- No new files or components needed
- All styling uses existing Tailwind utilities
- Cards use `bg-foreground/[0.01]`, `border-border/10`, `hover:border-primary/20`, `rounded-2xl`
- Section wrapper: `py-10 md:py-20`, `max-w-4xl mx-auto px-6`

