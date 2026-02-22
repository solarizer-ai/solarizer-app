
I will rebuild the Solarizer homepage into the specified 9-section layout, incorporating your latest updates for the Hero section. This approach prioritizes a technical, stable aesthetic with precise spacing and typography.

### 1. Component Architecture
I will create a modular structure by building 6 new section components in a new directory `src/components/home/`. This keeps the main `Home.tsx` clean and maintainable.

*   `src/components/home/RealFindings.tsx`: 3 stacked finding cards (Critical, High, Medium) with severity-colored left borders.
*   `src/components/home/DifferentiatorComparison.tsx`: A side-by-side (desktop) or stacked (mobile) comparison between traditional scanners and Solarizer.
*   `src/components/home/HowItWorks.tsx`: 4 numbered steps with connecting lines and terminal-style code blocks for the first two steps.
*   `src/components/home/SpeedPositioning.tsx`: A minimal list-based comparison showing the speed and efficiency advantages of Solarizer over manual audits.
*   `src/components/home/EngineExplanation.tsx`: A grid/list of 5 feature cards explaining the technical phases (Complexity Analysis, etc.).
*   `src/components/home/TrustSignals.tsx`: 3 key metrics/signals for social proof and technical credibility.

### 2. Hero Section Updates
I will modify the Hero section in `src/pages/Home.tsx` to:
*   Update the **Subtext** to the two-line format:
    *   "Detect real exploit paths in minutes — not weeks."
    *   "Trace cross-contract attack flows and receive line-accurate fixes."
*   Add the **Trust microtext**: "CLI-first · Works locally · No upload required".
*   Add the **Label above the terminal**: "Real Solarizer Analysis".
*   Implement the two-column grid layout for desktop and stacked layout for mobile.
*   Set the section height to **92vh**.

### 3. Page Rebuild (src/pages/Home.tsx)
I will perform a major rewrite of `src/pages/Home.tsx`:
*   **Remove** outdated data arrays (`phases`, `protocolFindings`, `securityFeatures`).
*   **Update** the `findings` data to match the new spec.
*   **Implement** the 9 sections in exact order:
    1.  Hero
    2.  Real Findings
    3.  Differentiator Comparison
    4.  How It Works
    5.  Speed Positioning
    6.  Engine Explanation
    7.  Trust Signals
    8.  CLI Install (including the new `curl` command: `curl -fsSL https://solarizer.io/install.sh | bash`)
    9.  Final CTA
*   Apply the **spacing system**: `py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]`.

### 4. Technical Specifications
*   **Typography**: Use `JetBrains Mono` for all code/terminal text and `Inter` for body text.
*   **Colors**: Ensure the background is precisely `hsl(0 0% 3%)`.
*   **Responsiveness**: Headline font sizing will use `clamp(1.6rem, 5vw, 5.5rem)` for fluid scaling.
*   **Terminal**: Ensure the `TerminalAuditDemo` is never cropped or blurred, maintaining its "credibility anchor" status.

### 5. Deployment
*   Create new files for the components.
*   Update `src/pages/Home.tsx`.
*   Verify all transitions and responsive states.

### Technical Details
*   **Container Max-Width**: `max-w-[1280px]`.
*   **Accent Color**: `hsl(24 95% 53%)`.
*   **Finding Card Radius**: `rounded-[16px]` (desktop) / `rounded-[14px]` (mobile).
*   **Installation Method**: Update from `npm` to the `curl` shell script.
