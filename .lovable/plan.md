
The plan is to update the pricing page and associated components to reflect the refined "nLOC limit per audit" terminology, while also implementing the "Includes everything in previous plan" structure for Blaze and Inferno tiers. We will also fix several hardcoded inconsistencies in credits and limits across the dashboard to ensure the UI matches the actual business logic.

### 1. Update Core Constants
Update `src/lib/nlocCalculator.ts` to match the latest plan limits presented on the pricing page (500 for Spark, 3,000 for Blaze, 12,000 for Inferno).

### 2. Redesign Pricing Page Specs
In `src/pages/Pricing.tsx`:
- Change `nLOC limit` to `nLOC limit per audit` for all plans.
- Simplify Blaze and Inferno's `Scan depth` value to `"Deep scan"`.
- Restructure Blaze and Inferno to use a new `Includes` row (e.g., `"Everything in Spark"`) and remove redundant specifications (like complexity levels) to maintain a minimalist look.
- Add a subtle highlight to the "Includes" value in the UI to distinguish it as a tier marker.

### 3. Ensure App-Wide Consistency
Update hardcoded descriptions and labels in other components that are currently out of sync with the 50-credit monthly allowance and the new nLOC limits:
- **`UpgradeToProModal.tsx`**: Fix the Blaze price ($19 → $199), update monthly allowance (150 → 50 credits), and use the "per audit" terminology.
- **`Settings.tsx`**: Update plan descriptions to show 50 credits and use "nLOC limit per audit".
- **`CreditBalance.tsx`**: Update the tooltip description for Spark users.
- **`PlansAndCostingPage.tsx` (Docs)**: Update comparison tables and body text to use "nLOC limit per audit" for consistency.

---

### Technical Details

**Data Structure Update in `src/pages/Pricing.tsx`:**
```typescript
// Blaze (Pro) example
{
  id: 'pro',
  // ...
  specs: [
    { label: 'Includes', value: 'Everything in Spark' },
    { label: 'Scan depth', value: 'Deep scan' },
    { label: 'Severity coverage', value: 'All (+ Low, Info, Gas)' },
    { label: 'nLOC limit per audit', value: '3,000' },
    // ... additions only
  ]
}
```

**UI Rendering Update:**
Modify the spec row loop to check if `spec.label === 'Includes'` and apply `text-primary` to the value for visual emphasis.

**Global Constants in `src/lib/nlocCalculator.ts`:**
```typescript
export const PLAN_LIMITS = {
  starter: { nlocPerScan: 500, ... },
  pro: { nlocPerScan: 3000, ... },
  business: { nlocPerScan: 12000, ... }
};
```
