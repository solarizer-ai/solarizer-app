
# Add Subscription Upgrade/Downgrade to Settings Page

## Status: ✅ COMPLETED

## Overview

Added the ability for logged-in users to upgrade or downgrade their subscription directly from the Settings page, eliminating the need to navigate to the Pricing page for plan changes.

## Implementation Summary

### Files Created
- `src/components/settings/SubscriptionPlanSelector.tsx` - New compact component showing all three plans with upgrade/downgrade actions

### Files Modified
- `src/pages/Settings.tsx` - Added plan selector component and wired up upgrade/downgrade modals

## Features Implemented

1. **Plan Selector Component**
   - Shows all three plans (Launch, Pro, Business) in horizontal card layout
   - Current plan highlighted with "Current Plan" badge
   - Upgrade buttons for higher tiers
   - Downgrade buttons for lower tiers
   - Pending downgrade indicator with cancel option
   - Disabled state when cancellation is pending

2. **Modal Integration**
   - Reuses existing `UpgradeConfirmationModal` for upgrades
   - Reuses existing `DowngradeWarningModal` for downgrades
   - Proper proration calculation for upgrades
   - Credit conversion preview for downgrades

3. **State Management**
   - Added state for upgrade/downgrade modals and target plans
   - Integrated with `useCashfreeSubscription` hook
   - Loading states for all subscription actions
