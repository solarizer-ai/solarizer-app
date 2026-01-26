import { Check, ArrowUp, ArrowDown, Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Plan {
  id: "launch" | "pro" | "business";
  name: string;
  price: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "launch",
    name: "Launch",
    price: 149,
    features: ["150 nLOC per scan", "1 file per scan", "Critical/High/Medium findings"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    features: ["Unlimited nLOC", "GitHub Import", "Export Reports", "Remediation"],
  },
  {
    id: "business",
    name: "Business",
    price: 499,
    features: ["Everything in Pro", "Share Reports", "Team Collaboration"],
  },
];

interface SubscriptionPlanSelectorProps {
  currentPlan: "starter" | "pro" | "business";
  pendingPlan: "starter" | "pro" | "business" | null;
  pendingPlanDate: string | null;
  hasPendingCancellation: boolean;
  onUpgrade: (plan: "pro" | "business") => void;
  onDowngrade: (plan: "launch" | "pro") => void;
  onCancelPendingDowngrade: () => void;
  isLoading: boolean;
  isCancellingDowngrade: boolean;
}

const PLAN_ORDER = { starter: 0, launch: 0, pro: 1, business: 2 };

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
  const normalizedCurrentPlan = currentPlan === "starter" ? "launch" : currentPlan;
  const currentPlanOrder = PLAN_ORDER[normalizedCurrentPlan];

  const getPlanAction = (planId: Plan["id"]) => {
    const planOrder = PLAN_ORDER[planId];
    
    if (planId === normalizedCurrentPlan) {
      return "current";
    }
    
    // Check if this plan is the pending downgrade target
    if (pendingPlan) {
      const normalizedPending = pendingPlan === "starter" ? "launch" : pendingPlan;
      if (planId === normalizedPending) {
        return "pending";
      }
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
            onClick={() => onDowngrade(plan.id as "launch" | "pro")}
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
        <h4 className="text-sm font-medium text-foreground">Change Your Plan</h4>
        {pendingPlan && pendingPlanDate && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3 h-3" />
            <span>Changes on {new Date(pendingPlanDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const action = getPlanAction(plan.id);
          const isCurrent = action === "current";
          const isPending = action === "pending";

          return (
            <div
              key={plan.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all",
                isCurrent && "border-primary bg-primary/5",
                isPending && "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10",
                !isCurrent && !isPending && "border-border hover:border-muted-foreground/50"
              )}
            >
              {isPending && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs dark:bg-amber-900/30 dark:text-amber-400">
                    Scheduled
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-foreground">{plan.name}</h5>
                  <p className="text-lg font-bold text-foreground">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>

                <ul className="space-y-1 text-xs text-muted-foreground">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-1">
                  {renderActionButton(plan)}
                </div>
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
