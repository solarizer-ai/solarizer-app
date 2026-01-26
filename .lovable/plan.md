
# Add Subscription Upgrade/Downgrade to Settings Page

## Overview

Add the ability for logged-in users to upgrade or downgrade their subscription directly from the Settings page, eliminating the need to navigate to the Pricing page for plan changes.

## Current State

- Settings page (`src/pages/Settings.tsx`) displays current plan info and cancel/reactivate options
- Upgrade/downgrade functionality exists only on Pricing page (`src/pages/Pricing.tsx`)
- Existing modals: `UpgradeConfirmationModal`, `DowngradeWarningModal`
- Hook `useCashfreeSubscription` provides: `upgradeSubscription`, `scheduleDowngrade`, `cancelPendingDowngrade`

## Implementation Approach

### 1. Create a New Subscription Management Component

Create `src/components/settings/SubscriptionPlanSelector.tsx` - a compact component showing available plans with upgrade/downgrade actions:

```text
+--------------------------------------------------+
|  Change Your Plan                                |
+--------------------------------------------------+
|  [Launch]     [Pro]        [Business]            |
|   $149/mo      $199/mo      $499/mo              |
|  [Current]   [Upgrade]    [Upgrade]              |
+--------------------------------------------------+
```

Features:
- Show all three plans in a horizontal card layout
- Current plan is highlighted with "Current Plan" badge
- Upgrade buttons for higher tiers
- Downgrade buttons for lower tiers
- Pending downgrade indicator with cancel option

### 2. Modify Settings Page

Update `src/pages/Settings.tsx`:

- Add state for upgrade/downgrade modals
- Import existing modals (`UpgradeConfirmationModal`, `DowngradeWarningModal`)
- Add the new `SubscriptionPlanSelector` component to the Subscription tab
- Wire up the modal logic (same pattern as Pricing page)

### 3. Component Structure

```text
Settings.tsx (Subscription Tab)
├── Current Plan Card (existing)
├── SubscriptionPlanSelector (NEW)
│   ├── Launch Plan Option
│   ├── Pro Plan Option
│   └── Business Plan Option
├── Credits Card (existing)
└── Billing History Link (existing)

Modals:
├── UpgradeConfirmationModal (reuse existing)
├── DowngradeWarningModal (reuse existing)
├── PurchasePowerUpModal (existing)
└── CancelSubscriptionModal (existing)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/SubscriptionPlanSelector.tsx` | Create | New component for plan selection |
| `src/pages/Settings.tsx` | Modify | Add plan selector, import modals, add state/handlers |

## Technical Details

### SubscriptionPlanSelector Component

```typescript
interface SubscriptionPlanSelectorProps {
  currentPlan: 'starter' | 'pro' | 'business';
  pendingPlan: 'starter' | 'pro' | 'business' | null;
  pendingPlanDate: string | null;
  onUpgrade: (plan: 'pro' | 'business') => void;
  onDowngrade: (plan: 'launch' | 'pro') => void;
  onCancelPendingDowngrade: () => void;
  isLoading: boolean;
}
```

Plans data structure (same as Pricing page):
- Launch: $149/mo - current tier for 'starter' users
- Pro: $199/mo - GitHub Import, Export, Remediation
- Business: $499/mo - Team collaboration, sharing

### Settings.tsx Changes

Add state:
```typescript
const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
const [targetUpgradePlan, setTargetUpgradePlan] = useState<'pro' | 'business'>('pro');
const [targetDowngradePlan, setTargetDowngradePlan] = useState<'launch' | 'pro'>('launch');
```

Add handlers:
```typescript
const handleUpgrade = async () => {
  setUpgradeModalOpen(false);
  await upgradeSubscription({ toPlan: targetUpgradePlan });
};

const handleConfirmDowngrade = () => {
  setDowngradeModalOpen(false);
  scheduleDowngrade(targetDowngradePlan);
};
```

### Proration Calculation

Reuse the same logic from Pricing page:
```typescript
const getPlanPrice = (planId: string) => {
  const prices = { launch: 149, pro: 199, business: 499 };
  return prices[planId] || 0;
};

const getProrationAmount = () => {
  const currentPrice = getPlanPrice(currentPlan === 'starter' ? 'launch' : currentPlan);
  const newPrice = getPlanPrice(targetUpgradePlan);
  return (newPrice - currentPrice) * 100; // cents
};
```

## UI/UX Considerations

1. **Compact Design**: The plan selector fits within the existing Settings card layout
2. **Clear Visual Hierarchy**: Current plan is prominently highlighted
3. **Confirmation Required**: All plan changes go through confirmation modals
4. **Pending State Visibility**: Scheduled downgrades show with cancel option
5. **Disabled States**: Launch users can't downgrade, Business users can't upgrade

## Testing Scenarios

1. Launch user clicks Upgrade to Pro - shows UpgradeConfirmationModal
2. Launch user clicks Upgrade to Business - shows UpgradeConfirmationModal
3. Pro user clicks Upgrade to Business - shows UpgradeConfirmationModal
4. Pro user clicks Downgrade to Launch - shows DowngradeWarningModal
5. Business user clicks Downgrade to Pro - shows DowngradeWarningModal
6. User with pending downgrade sees "Scheduled" badge with cancel option
7. User with pending cancellation cannot change plans
