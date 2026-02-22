

# Update Per-Credit Pricing to $2.80 / $2.50 / $2.20

## Overview
Update all credit rate references from $5.50/$5.00/$4.50 to $2.80/$2.50/$2.20 for Spark/Blaze/Inferno respectively, across all frontend components, docs, and the backend edge function.

## Files to Update

### 1. `src/lib/nlocCalculator.ts` (source of truth)
- Change `PLAN_CREDIT_RATES`: starter 550 -> 280, pro 500 -> 250, business 450 -> 220

### 2. `src/components/PurchasePowerUpModal.tsx`
- Update `getPricePerCreditCents`: business 450 -> 220, pro 500 -> 250, starter 550 -> 280
- Update discount percent calculation (base is now $2.80): business ~21%, pro ~11%
- Update comment "Calculate discount from base $5.50" -> "$2.80"

### 3. `src/pages/Pricing.tsx`
- Update `powerUpPrice` in plan data: Spark 5.5 -> 2.8, Blaze 5 -> 2.5, Inferno 4.5 -> 2.2
- Update Inferno feature text: "$4.50/credit" -> "$2.20/credit"
- Update fallback text: "starting at $4.50/credit" -> "starting at $2.20/credit"

### 4. `src/components/UpgradeConfirmationModal.tsx`
- Update business features: "$4.50/credit" -> "$2.20/credit"

### 5. `src/pages/docs/PlansAndCostingPage.tsx`
- Power-Up rate table (Tab 1): $5.50/$5.00/$4.50 -> $2.80/$2.50/$2.20
- Savings percentages: recalculate from $2.80 base (Blaze ~11% off, Inferno ~21% off)
- Plan Comparison table (Tab 2): same rate updates
- Example walkthrough (Tab 4): $5.50 each = $1,006.50 -> $2.80 each = $512.40

### 6. `supabase/functions/razorpay-create-order/index.ts` (backend)
- Update `POWER_UP_RATES`: starter/launch 550 -> 280, pro 500 -> 250, business 450 -> 220

## Discount Percentages (recalculated from $2.80 base)
- Spark: $2.80 -- base (0% off)
- Blaze: $2.50 -- ~11% off
- Inferno: $2.20 -- ~21% off

