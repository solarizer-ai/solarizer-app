

# Fix: Charge Full Price Difference on Upgrade (Not Time-Prorated)

## Problem

The upgrade function calculates a time-based proration: `(priceDifference * daysRemaining) / totalDays`. So if you're 12 days into a 30-day cycle, it charges only ~42% of the $350 difference = $146.78.

Per the business model, upgrades should charge the **full price difference** immediately, not a partial amount based on remaining days.

## Fix

### File: `supabase/functions/razorpay-upgrade-subscription/index.ts`

1. **Remove the `calculateProration` function** -- it's no longer needed.
2. **Replace with simple subtraction**: `prorationAmount = PLAN_PRICES[toPlan] - PLAN_PRICES[fromPlan]`
3. **Remove `PLAN_ORDER.launch`** -- stale entry from before the naming unification.
4. **Clean up unused variables**: `periodStart`, `periodEnd`, `totalDays`, `daysRemaining` are no longer needed for the amount calculation (keep period dates only if needed for metadata).

### Before
```typescript
const prorationAmount = calculateProration(fromPlan, toPlan, daysRemaining, totalDays);
// Result: (35000 * 12) / 30 = 14000 ($140) -- WRONG
```

### After
```typescript
const priceDifference = PLAN_PRICES[toPlan] - (PLAN_PRICES[fromPlan] || 0);
// Result: 49900 - 14900 = 35000 ($350) -- CORRECT
```

### Also clean up `PLAN_ORDER`
```typescript
// Before
const PLAN_ORDER: Record<string, number> = {
  starter: 0,
  launch: 1,  // stale
  pro: 2,
  business: 3,
};

// After
const PLAN_ORDER: Record<string, number> = {
  starter: 0,
  pro: 1,
  business: 2,
};
```

## Summary

| What | Before | After |
|------|--------|-------|
| Launch -> Business amount | ~$146.78 (time-prorated) | $350.00 (full difference) |
| Launch -> Pro amount | ~$20-50 (varies by day) | $50.00 (full difference) |
| `PLAN_ORDER` | Has stale `launch` key | Clean, `starter`/`pro`/`business` only |

