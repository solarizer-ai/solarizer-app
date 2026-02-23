import { Check, ArrowUp, ArrowDown, Clock, X, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatPlanName } from "@/lib/planNames";

interface Plan {
  id: "starter" | "pro" | "business";
  name: string;
  price: number;
  keyFeature: string;
}

const PLANS: Plan[] = [
  { id: "starter", name: "Spark", price: 149, keyFeature: "500 nLOC per scan" },
  { id: "pro", name: "Blaze", price: 199, keyFeature: "3,000 nLOC + deep scan" },
  { id: "business", name: "Inferno", price: 499, keyFeature: "12,000 nLOC + teams" },
];

interface SubscriptionPlanSelectorProps {
  currentPlan: "starter" | "pro" | "business" | null;
  pendingPlan: "starter" | "pro" | "business" | null;
  pendingPlanDate: string | null;
  hasPendingCancellation: boolean;
  onUpgrade: (plan: "pro" | "business") => void;
  onDowngrade: (plan: "starter" | "pro") => void;
  onSubscribe?: (plan: "starter" | "pro" | "business") => void;
  onCancelPendingDowngrade: () => void;
  isLoading: boolean;
  isCancellingDowngrade: boolean;
  // New props for unified card
  onCancelSubscription?: () => void;
  renewalDate?: string | null;
  onReactivate?: () => void;
  isReactivating?: boolean;
}

const PLAN_ORDER = { starter: 0, pro: 1, business: 2 };

export function SubscriptionPlanSelector({
  currentPlan,
  pendingPlan,
  pendingPlanDate,
  hasPendingCancellation,
  onUpgrade,
  onDowngrade,
  onSubscribe,
  onCancelPendingDowngrade,
  isLoading,
  isCancellingDowngrade,
  onCancelSubscription,
  renewalDate,
  onReactivate,
  isReactivating,
}: SubscriptionPlanSelectorProps) {
  const currentPlanOrder = currentPlan ? PLAN_ORDER[currentPlan] : -1;

  const getPlanAction = (planId: Plan["id"]) => {
    if (currentPlan === null) return "subscribe";
    const planOrder = PLAN_ORDER[planId];
    if (planId === currentPlan) return "current";
    if (pendingPlan && planId === pendingPlan) return "pending";
    if (planOrder > currentPlanOrder) return "upgrade";
    if (planOrder < currentPlanOrder) return "downgrade";
    return "current";
  };

  const renderActionButton = (plan: Plan) => {
    const action = getPlanAction(plan.id);

    if (hasPendingCancellation) {
      if (action === "current") {
        return (
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            <Check className="w-3 h-3 mr-1" />
            Current Plan
          </Badge>
        );
      }
      return (
        <Button variant="outline" size="sm" disabled className="w-full">
          Unavailable
        </Button>
      );
    }

    switch (action) {
      case "subscribe":
        return (
          <Button size="sm" className="w-full gap-1" onClick={() => onSubscribe?.(plan.id)} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUp className="w-3 h-3" />}
            Subscribe
          </Button>
        );
      case "current":
        return (
          <div className="space-y-1.5">
            <Badge variant="secondary" className="w-full justify-center py-1.5">
              <Check className="w-3 h-3 mr-1" />
              Current Plan
            </Badge>
            {onCancelSubscription && (
              <button
                onClick={onCancelSubscription}
                disabled={isLoading}
                className="w-full text-xs text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        );
      case "pending":
        return (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            onClick={onCancelPendingDowngrade}
            disabled={isCancellingDowngrade}
          >
            {isCancellingDowngrade ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Cancel Scheduled
          </Button>
        );
      case "upgrade":
        return (
          <Button size="sm" className="w-full gap-1" onClick={() => onUpgrade(plan.id as "pro" | "business")} disabled={isLoading || pendingPlan !== null}>
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUp className="w-3 h-3" />}
            Upgrade
          </Button>
        );
      case "downgrade":
        return (
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => onDowngrade(plan.id as "starter" | "pro")} disabled={isLoading || pendingPlan !== null}>
            <ArrowDown className="w-3 h-3" />
            Downgrade
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Your Plan</h4>
        {renewalDate && !hasPendingCancellation && (
          <p className="text-xs text-muted-foreground">
            Renews {format(new Date(renewalDate), "MMM d, yyyy")}
          </p>
        )}
        {pendingPlan && pendingPlanDate && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>Changes on {new Date(pendingPlanDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Cancellation banner */}
      {hasPendingCancellation && onReactivate && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Cancellation Scheduled</p>
            {renewalDate && (
              <p className="text-xs text-muted-foreground">
                Access until {format(new Date(renewalDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onReactivate} disabled={isReactivating}>
            {isReactivating ? "..." : "Reactivate"}
          </Button>
        </div>
      )}

      {/* Pending downgrade banner */}
      {pendingPlan && pendingPlanDate && !hasPendingCancellation && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Downgrade Scheduled</p>
            <p className="text-xs text-muted-foreground">
              Changes to {formatPlanName(pendingPlan)} on {format(new Date(pendingPlanDate), "MMM d, yyyy")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onCancelPendingDowngrade} disabled={isCancellingDowngrade}>
            {isCancellingDowngrade ? "..." : "Cancel"}
          </Button>
        </div>
      )}

      {/* Plan rows */}
      <div className="flex flex-col space-y-2">
        {PLANS.map((plan) => {
          const action = getPlanAction(plan.id);
          const isCurrent = action === "current";
          const isPending = action === "pending";

          return (
            <div
              key={plan.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all",
                isCurrent && "border-l-4 border-l-primary border-t border-r border-b border-border bg-primary/5",
                isPending && "border-l-4 border-l-amber-400 border-t border-r border-b border-amber-300 bg-amber-50/50 dark:bg-amber-900/10",
                !isCurrent && !isPending && "border-l-4 border-l-transparent hover:border-l-muted-foreground/30"
              )}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-[80px]">
                  <h5 className="font-semibold text-foreground">{plan.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    ${plan.price}<span className="text-xs">/mo</span>
                  </p>
                </div>
                {isPending && (
                  <Badge variant="outline" className="hidden sm:flex bg-amber-100 text-amber-700 border-amber-300 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                    Scheduled
                  </Badge>
                )}
              </div>
              <div className="w-32 flex-shrink-0 ml-4">
                {renderActionButton(plan)}
              </div>
            </div>
          );
        })}
      </div>

      {hasPendingCancellation && (
        <p className="text-xs text-muted-foreground text-center">
          Plan changes are disabled while cancellation is pending.
        </p>
      )}
    </div>
  );
}
