

## Summary

Remove annual billing plans completely from the application - only monthly billing will be available.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Pricing.tsx` | Remove billing toggle, annual pricing, and related UI |
| `src/hooks/useCashfreeSubscription.ts` | Remove `annual` from type |
| `src/hooks/useSubscription.ts` | Remove `annual` from type |
| `src/components/UpgradeConfirmationModal.tsx` | Remove `billingPeriod` prop |
| `src/pages/Docs.tsx` | Remove Annual Discount FAQ |
| `src/lib/nlocCalculator.ts` | Remove annual credits config |
| `src/pages/Settings.tsx` | Remove annual display logic |
| `supabase/functions/cashfree-create-subscription/index.ts` | Remove annual pricing/plan IDs |
| `supabase/functions/cashfree-upgrade-subscription/index.ts` | Remove annual pricing/plan IDs |
| `supabase/functions/cashfree-create-order/index.ts` | Remove annual pricing |
| `supabase/functions/cashfree-webhook/index.ts` | Simplify billing period extraction |

---

## 1. Frontend - Pricing Page (`src/pages/Pricing.tsx`)

### Remove from Interface (lines 29-31, 35)
```tsx
// REMOVE these properties from PricingPlan interface:
annualPrice: number | null;
annualCredits: number;
hasAnnualDiscount: boolean;
```

### Simplify Plan Data (lines 38-100)
Remove `annualPrice`, `annualCredits`, and `hasAnnualDiscount` from each plan definition.

### Remove State (line 105)
```tsx
// REMOVE:
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
```

### Remove Billing Toggle UI (lines 283-299)
Delete the entire billing period toggle section with the Switch component.

### Simplify Price Display (lines 304-310)
Change to always show monthly price:
```tsx
const displayPrice = plan.monthlyPrice;
const priceLabel = '/mo';
```

### Remove Annual Badge (lines 338-344)
Delete the "2 Months Free" badge logic.

### Simplify Credits Display (lines 361-365)
```tsx
<p className="text-sm text-muted-foreground mt-2">
  {plan.monthlyCredits} Credits included
</p>
```

### Update Subscribe Handler (lines 136-141)
Always pass `monthly`:
```tsx
await createSubscription({
  plan: planId,
  billingPeriod: 'monthly',
});
```

### Update UpgradeConfirmationModal Props (lines 470-478)
Remove `billingPeriod` prop.

---

## 2. Frontend - Hooks

### `useCashfreeSubscription.ts` (line 9)
```tsx
// BEFORE:
billingPeriod: "monthly" | "annual";

// AFTER:
billingPeriod: "monthly";
```

### `useSubscription.ts` (line 183)
```tsx
// BEFORE:
billingPeriod: 'monthly' | 'annual';

// AFTER:
billingPeriod: 'monthly';
```

---

## 3. Frontend - UpgradeConfirmationModal (`src/components/UpgradeConfirmationModal.tsx`)

### Remove `billingPeriod` prop (line 17)
Remove from interface and component.

### Update renewal text (line 94)
```tsx
// BEFORE:
Your next {billingPeriod} renewal will be at the full {formatPlanName(toPlan)} rate.

// AFTER:
Your next monthly renewal will be at the full {formatPlanName(toPlan)} rate.
```

---

## 4. Frontend - Docs FAQ (`src/pages/Docs.tsx`)

### Remove Annual Discount FAQ (lines 43-47)
Delete this FAQ entry:
```tsx
{
  question: "How does the Annual Discount work?",
  answer: "If you choose Annual billing..."
}
```

---

## 5. Frontend - nlocCalculator (`src/lib/nlocCalculator.ts`)

### Remove Annual Credits (lines 65-70)
```tsx
// REMOVE:
annual: {
  starter: 50,
  launch: 50,
  pro: 500,
  business: 500,
},
```

---

## 6. Frontend - Settings Page (`src/pages/Settings.tsx`)

### Simplify Price Display (line 343)
```tsx
// BEFORE:
{isPro ? "$199" : "$499"}/{subscription?.billing_period === 'annual' ? 'year' : 'month'}

// AFTER:
{isPro ? "$199" : "$499"}/month
```

---

## 7. Backend - cashfree-create-subscription (Edge Function)

### Remove Annual Pricing (lines 9-13)
```tsx
// BEFORE:
const SUBSCRIPTION_PRICES_INR = {
  launch: { monthly: 12367 },
  pro: { monthly: 16517, annual: 165170 },
  business: { monthly: 41417, annual: 414170 },
};

// AFTER:
const SUBSCRIPTION_PRICES_INR = {
  launch: { monthly: 12367 },
  pro: { monthly: 16517 },
  business: { monthly: 41417 },
};
```

### Remove Annual Plan IDs (lines 16-20)
```tsx
// BEFORE:
const CF_PLAN_IDS = {
  launch: { monthly: "solarizer_launch_monthly" },
  pro: { monthly: "solarizer_pro_monthly", annual: "solarizer_pro_annual" },
  business: { monthly: "solarizer_business_monthly", annual: "solarizer_business_annual" },
};

// AFTER:
const CF_PLAN_IDS = {
  launch: { monthly: "solarizer_launch_monthly" },
  pro: { monthly: "solarizer_pro_monthly" },
  business: { monthly: "solarizer_business_monthly" },
};
```

### Simplify Plan Details (lines 112-118)
```tsx
// BEFORE:
plan_name: `Solarizer ${plan} ${billingPeriod === 'annual' ? 'Annual' : 'Monthly'}`,
plan_max_cycles: billingPeriod === "annual" ? 10 : 120,
plan_intervals: billingPeriod === "annual" ? 12 : 1,

// AFTER:
plan_name: `Solarizer ${plan} Monthly`,
plan_max_cycles: 120,
plan_intervals: 1,
```

---

## 8. Backend - cashfree-upgrade-subscription (Edge Function)

### Remove Annual Pricing (lines 9-20)
Same changes as create-subscription - remove annual prices and plan IDs.

### Simplify Plan Details (lines 232-238)
Same changes - remove annual-specific logic.

---

## 9. Backend - cashfree-create-order (Edge Function)

### Remove Annual Pricing (lines 9-13)
```tsx
// BEFORE:
const SUBSCRIPTION_PRICES = {
  launch: { monthly: 14900 },
  pro: { monthly: 19900, annual: 199000 },
  business: { monthly: 49900, annual: 499000 },
};

// AFTER:
const SUBSCRIPTION_PRICES = {
  launch: { monthly: 14900 },
  pro: { monthly: 19900 },
  business: { monthly: 49900 },
};
```

---

## 10. Backend - cashfree-webhook (Edge Function)

### Simplify Billing Period Extraction (lines 167-175)
```tsx
// BEFORE:
let billingPeriod = "monthly";
if (planId) {
  const parts = planId.split("_");
  if (parts.length >= 3) {
    plan = parts[1];
    billingPeriod = parts[2]; // "monthly" or "annual"
  }
}

// AFTER:
const billingPeriod = "monthly"; // Always monthly now
if (planId) {
  const parts = planId.split("_");
  if (parts.length >= 2) {
    plan = parts[1]; // "launch", "pro", or "business"
  }
}
```

---

## Notes

- **Existing annual subscribers**: The webhook will continue to process existing annual subscriptions correctly since it reads billing period from the database, not from the plan ID
- **Database functions**: The `purchase_subscription`, `process_subscription_renewal`, and `process_payment_success` RPCs will still work - they just won't receive annual billing periods anymore
- **No database migration needed**: The `billing_period` column can remain as-is; existing annual subscriptions will continue to renew until their term ends

