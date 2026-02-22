

# Rewrite Documentation Pages with Accurate CLI Content

## Overview
Replace outdated web-UI content in both `DocsPage.tsx` (dashboard) and `Docs.tsx` (public) with accurate CLI-based documentation. The page structure (Tabs, Cards, Accordion) stays the same. FAQ tab is untouched. Only the Getting Started tab content changes, plus two new cards are added.

## Changes

### Both files: `src/pages/dashboard/DocsPage.tsx` and `src/pages/Docs.tsx`

Since both files contain identical docs content, both get the same updates:

**1. Add `Terminal` to lucide-react imports**

**2. Card 1: "Installation & Setup" (replaces "Quick Start Guide")**
- Title: "Installation & Setup"
- Description: "Get up and running in under 2 minutes"
- 3 numbered steps with inline code snippets:
  - Step 1: Install the CLI (`npm install -g @solarizer/cli`)
  - Step 2: Launch & Authenticate (run `solarizer`, paste API key, or use env var `SOLARIZER_API_KEY`)
  - Step 3: You're on the Dashboard (navigate with arrow keys, select with Enter)
- Code snippets rendered in a minimal monospace `bg-muted` inline style

**3. Card 2: "Running an Audit" (new card, inserted before Security Grades)**
- Icon: `Shield`
- Title: "Running an Audit"
- Description: "The 6-step guided audit wizard"
- 7 numbered steps covering the full audit flow (Start Audit, Project Name, Select Scope Files, Context Files, Additional Context, Complexity Estimate, Cost Confirmation)
- Followed by a "What happens next" section listing the 6 analysis phases (Hunting, Cross-Contract, Validation, QA Scan, Formatting, Report Generation) as a clean bulleted list

**4. Card 3: Security Grades -- no changes**

**5. Card 4: "Dashboard Reference" (new card, added after Security Grades)**
- Icon: `Terminal`
- Title: "Dashboard Reference"
- Description: "Actions available from the Solarizer dashboard"
- Clean table with 3 columns: Action, Section, Description (6 rows covering Start Audit, Resume Audit, Theme, Auth, Editor, Permissions)
- Navigation hints below the table showing keyboard shortcuts

## Technical Details

- No new dependencies needed
- No structural changes to the page layout (Tabs/Cards pattern preserved)
- Inline code uses a `font-mono text-xs bg-muted px-1.5 py-0.5 rounded` style for consistency
- The table in Card 4 uses the existing `@/components/ui/table` components for a clean look
- Both files are updated in parallel to stay in sync

