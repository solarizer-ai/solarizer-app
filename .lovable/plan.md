

## Problem

When downgrading from Business to Launch, the database throws:
**`invalid input value for enum subscription_plan: "launch"`**

The database enum `subscription_plan` only has values: `starter`, `pro`, `business`. The UI displays the plan as "Launch" but must convert it to `"starter"` before sending to the database.

**Root cause**: The conversion from `"launch"` to `"starter"` is inconsistent across the codebase:
- **Settings page** (line 190): Correctly converts `"launch"` to `"starter"` before calling `scheduleDowngrade` 
- **Pricing page** (line 234): Does NOT convert -- passes `"launch"` directly, causing the database error

## Fix

### File: `src/pages/Pricing.tsx`

Update `handleConfirmDowngrade` to convert `"launch"` to `"starter"` before calling `scheduleDowngrade`:

```typescript
const handleConfirmDowngrade = () => {
  setDowngradeModalOpen(false);
  const dbPlan = targetDowngradePlan === "launch" ? "starter" : targetDowngradePlan;
  scheduleDowngrade(dbPlan);
};
```

This is a one-line fix that mirrors the existing pattern in `Settings.tsx`.

## Technical Details

- The `subscription_plan` enum in the database has: `starter`, `pro`, `business`
- The UI uses `"launch"` as a display alias for `"starter"`
- The `SubscriptionPlanSelector` component uses plan IDs `"launch" | "pro" | "business"` for display
- The conversion must happen before any database operation

