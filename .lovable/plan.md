

# Update Current Plan Checkmark Position

## Change

### `src/components/settings/SubscriptionPlanSelector.tsx`

Move the green `CheckCircle` icon from the action button area to beside the plan name in the left side of the row.

**Plan row (around line 155-162)**: Add the checkmark next to the plan name `<h5>`:

```
<div className="min-w-[80px]">
  <div className="flex items-center gap-1.5">
    <h5 className="font-semibold text-foreground">{plan.name}</h5>
    {isCurrent && <CheckCircle className="w-4 h-4 text-green-500" />}
  </div>
  <p className="text-sm text-muted-foreground">...</p>
</div>
```

**Action area for current plan (case "current", around line 96-112)**: Remove the `CheckCircle` from there, keep only the Cancel Subscription button:

```
case "current":
  return (
    onCancelSubscription ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancelSubscription}
        disabled={isLoading}
        className="h-auto py-0.5 px-2 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
      >
        Cancel Subscription
      </Button>
    ) : null
  );
```

**Import**: Add `CheckCircle` to the lucide-react import (replacing the `Check` icon usage for current plan).

No other files need changes.

