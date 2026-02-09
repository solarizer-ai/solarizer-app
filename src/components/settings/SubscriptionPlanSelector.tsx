import { Check, ArrowUp, ArrowDown, Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Plan {
  id: "starter" | "pro" | "business";
  name: string;
  price: number;
  keyFeature: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Launch",
    price: 149,
    keyFeature: "150 nLOC per scan",
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    keyFeature: "Unlimited nLOC + GitHub",
  },
  {
    id: "business",
    name: "Business",
    price: 499,
    keyFeature: "Everything in Pro + Teams",
  },
];

interface SubscriptionPlanSelectorProps {
  currentPlan: "starter" | "pro" | "business";
  pendingPlan: "starter" | "pro" | "business" | null;
  pendingPlanDate: string | null;
  hasPendingCancellation: boolean;
  onUpgrade: (plan: "pro" | "business") => void;
  onDowngrade: (plan: "starter" | "pro") => void;
  onCancelPendingDowngrade: () => void;
  isLoading: boolean;
  isCancellingDowngrade: boolean;
}

const PLAN_ORDER = { starter: 0, pro: 1, business: 2 };

export function SubscriptionPlanSelector({
  currentPlan,
  pendingPlan,
  pendingPlanDate,
  hasPendingCancellation,
  onUpgrade,
  onDowngrade,
  onCancelPendingDowngrade,
  isLoading,
  isCancellingDowngrade,
}: SubscriptionPlanSelectorProps) {
  const currentPlanOrder = PLAN_ORDER[currentPlan];

  const getPlanAction = (planId: Plan["id"]) => {
    const planOrder = PLAN_ORDER[planId];
    
    if (planId === currentPlan) {
      return "current";
    }
    
    // Check if this plan is the pending downgrade target
    if (pendingPlan && planId === pendingPlan) {
      return "pending";
    }
    
    if (planOrder > currentPlanOrder) {
      return "upgrade";
    }
    
    if (planOrder < currentPlanOrder) {
      return "downgrade";
    }
    
    return "current";
  };

  const renderActionButton = (plan: Plan) => {
    const action = getPlanAction(plan.id);
    
    // Disable all actions if there's a pending cancellation
    if (hasPendingCancellation) {
      return (
        <Button variant="outline" size="sm" disabled className="w-full">
          {action === "current" ? "Current Plan" : "Unavailable"}
        </Button>
      );
    }

    switch (action) {
      case "current":
        return (
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            <Check className="w-3 h-3 mr-1" />
            Current Plan
          </Badge>
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
            {isCancellingDowngrade ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
            Cancel Scheduled
          </Button>
        );
      case "upgrade":
        return (
          <Button
            size="sm"
            className="w-full gap-1"
            onClick={() => onUpgrade(plan.id as "pro" | "business")}
            disabled={isLoading || pendingPlan !== null}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <ArrowUp className="w-3 h-3" />
            )}
            Upgrade
          </Button>
        );
      case "downgrade":
        return (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1"
            onClick={() => onDowngrade(plan.id as "starter" | "pro")}
            disabled={isLoading || pendingPlan !== null}
          >
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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Plans</h4>
        {pendingPlan && pendingPlanDate && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>Changes on {new Date(pendingPlanDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

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
              {/* Left: Plan name, price, and feature */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-[80px]">
                  <h5 className="font-semibold text-foreground">{plan.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    ${plan.price}<span className="text-xs">/mo</span>
                  </p>
                </div>
                
                {/* Pending indicator inline */}
                {isPending && (
                  <Badge variant="outline" className="hidden sm:flex bg-amber-100 text-amber-700 border-amber-300 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                    Scheduled
                  </Badge>
                )}
              </div>

              {/* Right: Action button - fixed width for alignment */}
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
