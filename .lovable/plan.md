

# Rewrite Pricing Page + Update Plan Names & Feature Gating

## Overview
Full rewrite of the pricing page with new plan names (Spark / Blaze / Inferno), updated features, and new copy. Additionally, update all feature gating references across the dashboard and report pages to use the new plan names.

## Changes

### 1. `src/pages/Pricing.tsx` -- Full content rewrite

**Header copy:**
- Title: "Security that scales with your code."
- Subtitle: "From solo devs to full teams. One engine, three intensities."

**Replace `pricingPlans` array** with three new plans:
- Spark (id: `starter`, label: "Essentials", $149/mo, powerUpPrice: $5.50, 9 features)
- Blaze (id: `pro`, label: "Most Popular", $199/mo, powerUpPrice: $5.00, 8 features)
- Inferno (id: `business`, label: "Full Power", $499/mo, powerUpPrice: $4.50, 6 features)

**Credit explainer:** "50 monthly credits included with every plan. Unused credits carry forward -- they never expire."

**Power-up section:** Update fallback text from "$5/credit" to "$4.50/credit"

No changes to button logic, modals, hooks, or layout structure.

### 2. `src/lib/nlocCalculator.ts` -- Update credit rates

Update `PLAN_CREDIT_RATES` to match new power-up prices:
- starter: 550 ($5.50)
- pro: 500 ($5.00)
- business: 450 ($4.50)

### 3. Create shared plan name helper: `src/lib/planNames.ts`

```typescript
export function formatPlanName(plan: string | null): string {
  if (!plan) return 'None';
  const names: Record<string, string> = {
    starter: 'Spark',
    pro: 'Blaze',
    business: 'Inferno',
  };
  return names[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
}
```

### 4. `src/components/FeatureLockedOverlay.tsx` -- Use new plan names

Update the plan name mapping:
- `requiredPlan === 'pro'` displays "Blaze" instead of "Pro"
- `requiredPlan === 'business'` displays "Inferno" instead of "Business"
- All "Upgrade to Pro" / "Upgrade to Business" buttons become "Upgrade to Blaze" / "Upgrade to Inferno"

### 5. `src/hooks/useFeatureAccess.ts` -- Remove `canViewSecurityCoverage`

Remove the `canViewSecurityCoverage` field from the `FeatureAccess` interface and hook return (feature was removed previously). Update JSDoc comments to reference Spark/Blaze/Inferno.

### 6. `src/hooks/useReportFeatureAccess.ts` -- Remove `canViewSecurityCoverage`

Same cleanup: remove `canViewSecurityCoverage` from the interface and return value. Update comments.

### 7. Dashboard & Report pages -- Update all "Upgrade to Pro/Business" strings

| File | Changes |
|------|---------|
| `src/pages/Report.tsx` | "Upgrade to Pro to export reports" -> "Upgrade to Blaze to export reports"; remove `canViewSecurityCoverage` destructuring |
| `src/pages/Settings.tsx` | All "Upgrade to Pro" -> "Upgrade to Blaze"; "Upgrade to Business" -> "Upgrade to Inferno"; "Business features" -> "Inferno features" |
| `src/pages/dashboard/SharingPage.tsx` | "Upgrade to Business" -> "Upgrade to Inferno"; "Business features" -> "Inferno features" |
| `src/pages/dashboard/SubscriptionPage.tsx` | "Upgrade to Pro" -> "Upgrade to Blaze" |
| `src/pages/dashboard/BillingPage.tsx` | "Upgrade to Pro" -> "Upgrade to Blaze" |
| `src/components/FindingItem.tsx` | "Upgrade to Pro" -> "Upgrade to Blaze" |
| `src/components/FindingsFilter.tsx` | "Upgrade to Pro" -> "Upgrade to Blaze" |
| `src/components/UpgradeToProModal.tsx` | Title "Upgrade to Pro" -> "Upgrade to Blaze"; "Launch plan" -> "Spark plan"; button text updated |

### 8. Other files with old plan display names

| File | Changes |
|------|---------|
| `src/components/CancelSubscriptionModal.tsx` | Import shared `formatPlanName`, remove local one |
| `src/components/UpgradeConfirmationModal.tsx` | Import shared `formatPlanName`, remove local one. Update `PLAN_FEATURES` with new Blaze/Inferno feature descriptions |
| `src/components/DowngradeWarningModal.tsx` | Import shared `formatPlanName`, remove local one |
| `src/components/settings/SubscriptionPlanSelector.tsx` | Plan names: "Spark", "Blaze", "Inferno"; key features updated |
| `src/pages/SubscriptionSuccess.tsx` | Import shared `formatPlanName`, replace local `getPlanName` |
| `src/pages/BillingHistory.tsx` | Import shared `formatPlanName`, replace local one |
| `src/pages/PaymentSuccess.tsx` | Import shared `formatPlanName`, replace local one |
| `src/pages/Index.tsx` | "Launch" -> "Spark" in pricing preview |
| `src/pages/TermsOfService.tsx` | "Launch, Pro, Business" -> "Spark, Blaze, Inferno" |

### 9. `src/components/UpgradeConfirmationModal.tsx` -- New feature lists

Replace `PLAN_FEATURES`:
- **pro (Blaze):** Deep scan, All severity levels, Up to 3,000 nLOC, Cross-contract analysis, AI validation, Remediation guidance, Free dashboard reports
- **business (Inferno):** Everything in Blaze, Up to 12,000 nLOC, Share reports, 5 collaborators, Remediation tracking, Lowest power-up rate

## What does NOT change
- Internal plan IDs (`starter`, `pro`, `business`) remain the same everywhere (database, hooks, Razorpay)
- All payment/subscription hooks untouched
- All modal open/close and button logic untouched
- Database schema and edge functions untouched
- Card layout, animations, and responsive design unchanged
