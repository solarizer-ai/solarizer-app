

# Unified Billing Page Redesign

## Overview

Merge "Current Plan" and "Plans" into one card. Simplify credits section. Apply to both `BillingPage.tsx` and `SubscriptionPage.tsx`.

## Changes

### 1. SubscriptionPlanSelector.tsx — Add cancel support

Add new optional props:
- `onCancelSubscription?: () => void` — shows "Cancel Subscription" link on current plan row
- `renewalDate?: string | null` — shows renewal info in header
- `onReactivate?: () => void` and `isReactivating?: boolean` — for reactivate action on cancellation banner

Move the pending cancellation/downgrade banners INTO this component (above the plan list). The current plan row's action area: show "Current Plan" badge + below it a red "Cancel Subscription" text link (when not cancelled).

### 2. BillingPage.tsx — Merge cards + simplify credits

**Plan section**: Remove the separate "Current Plan" card (lines 170-252) and the separate "Plan Selector" card wrapper (lines 254-270). Replace with a single card containing:
- Header: "Your Plan" with renewal date on the right
- Pending cancellation/downgrade banners (now rendered by SubscriptionPlanSelector)
- The 3 plan rows with cancel on current plan row

Pass new props to SubscriptionPlanSelector: `onCancelSubscription`, `renewalDate`, `onReactivate`, `isReactivating`.

**Credits section** (lines 272-311): Simplify to compact layout:
- For paid users: Two inline stats side by side showing just "Remaining" and "Total Used" (no cycle language, no reset date). Reduce number size from `text-3xl` to `text-xl`. Right-aligned "Buy Credits" button in header area instead of full-width below.
- For free users: Single stat "Remaining" with upgrade CTA.

### 3. SubscriptionPage.tsx — Mirror same changes

Apply identical merged layout and credits simplification as BillingPage.

## Technical Details

### SubscriptionPlanSelector.tsx
- Add props: `onCancelSubscription`, `renewalDate`, `onReactivate`, `isReactivating`
- Render cancellation/downgrade banners at top of component
- In current plan row action area: Badge + cancel link below
- Header shows "Your Plan" + renewal date

### BillingPage.tsx
- Delete lines 169-270 (two separate cards)
- Replace with single card passing all props to enhanced SubscriptionPlanSelector
- Credits card: remove `period_reset_at` display, rename "Credits Left" to "Remaining", rename "Used This Cycle" to "Total Used", shrink font to `text-xl`, remove full-width button — add compact "Buy Credits" button in card header

### SubscriptionPage.tsx
- Same structural changes as BillingPage (delete two cards, replace with one unified card, simplify credits)
