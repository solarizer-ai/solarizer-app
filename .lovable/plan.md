

# Redesign Subscription Plan Selector as Full-Width Stacked Tabs

## Current Issue

The current layout uses a 3-column grid on desktop where each plan is a separate card. This causes alignment issues because:
- Each card has variable content height (different number of features)
- Action buttons appear at different vertical positions within each card

## Solution

Convert to a **full-width stacked horizontal tab design** where each plan is a single row spanning the full width, with all elements (plan name, price, key feature, and action button) aligned horizontally.

## New Layout Design

```text
+------------------------------------------------------------------+
| Launch    $149/mo   150 nLOC per scan            [Current Plan]  |
+------------------------------------------------------------------+
| Pro       $199/mo   Unlimited nLOC + GitHub      [Upgrade →]     |
+------------------------------------------------------------------+
| Business  $499/mo   Everything in Pro + Teams    [Upgrade →]     |
+------------------------------------------------------------------+
```

Each row will be:
- Full width of the container
- Horizontally laid out with consistent alignment
- Plan name and price on the left
- Key feature summary in the middle
- Action button on the right (all buttons perfectly aligned)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/SubscriptionPlanSelector.tsx` | Modify | Restructure from grid cards to stacked horizontal rows |

## Implementation Details

### Layout Structure

```tsx
<div className="space-y-2">
  {PLANS.map((plan) => (
    <div className="flex items-center justify-between p-4 rounded-lg border w-full">
      {/* Left: Plan name and price */}
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <h5>{plan.name}</h5>
          <p>${plan.price}/mo</p>
        </div>
        {/* Middle: Key feature (hidden on mobile) */}
        <span className="hidden sm:block text-muted-foreground">
          {plan.features[0]}
        </span>
      </div>
      
      {/* Right: Action button - fixed width for alignment */}
      <div className="w-32 flex-shrink-0">
        {renderActionButton(plan)}
      </div>
    </div>
  ))}
</div>
```

### Key Changes

1. **Horizontal Row Layout**: Replace `grid grid-cols-3` with `flex flex-col space-y-2`
2. **Consistent Button Alignment**: All action buttons have fixed width (`w-32`) and right-aligned
3. **Responsive Feature Display**: Show key feature text on desktop, hide on mobile
4. **Pending Badge**: Move from floating to inline indicator
5. **Current Plan Highlight**: Left border accent instead of full background

### Visual States

| State | Left Border | Background | Button Style |
|-------|-------------|------------|--------------|
| Current Plan | `border-l-4 border-primary` | `bg-primary/5` | Badge: "Current Plan" |
| Upgrade Available | `border-l-4 border-transparent` | `bg-background` | Primary button: "Upgrade" |
| Downgrade Available | `border-l-4 border-transparent` | `bg-background` | Outline button: "Downgrade" |
| Pending Downgrade | `border-l-4 border-amber-400` | `bg-amber-50/50` | Amber button: "Cancel" |

### Mobile Responsiveness

- On mobile: Stack plan name/price vertically, hide feature text, keep button right-aligned
- On desktop: Full horizontal layout with all elements visible

