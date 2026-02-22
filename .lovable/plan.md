
# Redesign "Run Your First Audit" CTA Section

Inspired by the Gemini CLI screenshot -- large bold heading, descriptive subtitle, polished install command box, and a secondary link below.

## Changes

### File: `src/pages/Home.tsx` (Section 4, lines 252-280)

Replace the current minimal CTA section with:

1. **Larger, bolder heading** -- increase to `text-3xl md:text-5xl` with `font-black`, split into two lines:
   - Line 1: "Secure your contracts"
   - Line 2: "from your terminal" (styled with `text-gradient` like the hero)

2. **Descriptive subtitle** -- add a paragraph below the heading:
   - "Multi-phase AI analysis, exploit-pattern matching, and line-accurate remediation -- all from a single CLI command."
   - Styled `text-sm md:text-lg text-muted-foreground/60`

3. **Polished install command box** -- keep the existing `npm install -g solarizer` but style it more prominently:
   - Slightly larger padding, rounded-xl, subtle border glow on hover (`hover:border-primary/30 transition-all`)
   - Keep the copy button

4. **Secondary link below** -- replace the "Open Dashboard" button with a text link styled in primary color:
   - "View documentation" linking to `/docs`
   - Styled as `text-sm text-primary hover:underline` with no button wrapper

5. **Remove** the current "Open Dashboard" button

### No other files modified
