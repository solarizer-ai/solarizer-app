

# Tier Feature Adjustments — 5 Changes

## Change 1: Architecture Insights — Inferno Only
**File: `src/pages/Report.tsx`**
- Line 448: Change `effectivePlan === 'starter'` to `effectivePlan !== 'business'` for the Insights tab lock icon
- Lines 608-614: Change condition from `effectivePlan === 'starter'` to `effectivePlan !== 'business'` and update `requiredPlan="pro"` to `requiredPlan="business"`

## Change 2: Dashboard Reports — Free for All Plans
- **`src/pages/Pricing.tsx` line 50**: `'5 credits each'` -> `'Free'`
- **`src/pages/docs/PlansAndCostingPage.tsx` line 342**: `"5 credits each"` -> `"Free"`
- **`src/pages/docs/PlansAndCostingPage.tsx` line 526**: `"5 credits per report"` -> `"Free"`
- **`src/pages/docs/PlansAndCostingPage.tsx` lines 531-534**: Replace paragraph with "Dashboard reports are free on all plans. Your local markdown report is also always available."
- **`src/components/UpgradeConfirmationModal.tsx` line 42**: Remove `"Free dashboard report access"` from pro features array

## Change 3: Multi-File Upload — All Plans
- **`src/components/wizard/UploadMethodStep.tsx`**: Remove all `isStarterPlan` logic, tooltip wrappers, and `Lock` import. Simplify to always-enabled cards.
- **`src/components/AuditWizard.tsx` line 89**: Remove `isStarterPlan` prop from `UploadMethodStep`
- **`src/components/UpgradeToProModal.tsx`**:
  - Line 15: Remove `'file_limit'` from reason type
  - Lines 39-43: Remove file_limit conditional, show only nLOC message
  - Line 27: Change text to `"Up to 3,000 nLOC per audit"` (remove "Multi-file analysis")

## Change 4: Remove POWER_UP_OPTIONS
**File: `src/lib/nlocCalculator.ts` lines 72-81**: Delete the `POWER_UP_OPTIONS` constant (confirmed no imports elsewhere).

## Change 5: Initial Credits
No changes needed — already correct at 50.

## Pre-existing Build Errors
The 16 TypeScript errors in the build output are all in edge function files (`_shared/`, `cli-*`) and are pre-existing type issues unrelated to these changes. They will not be affected by this work.

### Technical Details
- 8 files modified total across all changes
- No database migrations needed
- No new dependencies
