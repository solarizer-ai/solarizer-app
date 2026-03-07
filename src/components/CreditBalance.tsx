import { Zap, Info } from "lucide-react";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CreditBalance() {
  const { data: subscription, isLoading: subLoading, isExpired } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  const isLoading = subLoading || creditsLoading;
  const plan = subscription?.plan || 'starter';
  const isTrial = plan === 'trial';
  const isPaid = plan === 'pro' || plan === 'business';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }

  // No subscription = show "No Plan" state
  if (!subscription) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">No Plan</span>
      </div>
    );
  }

  const creditsRemaining = credits?.credits_remaining ?? 0;

  // Calculate trial days remaining
  const trialDaysLeft = isTrial && subscription.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const tooltipText = isTrial
    ? isExpired
      ? "Trial ended. Subscribe to continue."
      : `Free Trial: ${trialDaysLeft} days left. Full Inferno-tier access.`
    : isPaid
      ? "Credits remaining. Purchase more for additional capacity."
      : `Inferno plan: ${PLAN_LIMITS.starter.nlocPerScan} nLOC per audit max. Purchase more for additional capacity.`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md">
        <Zap className={`h-4 w-4 ${isTrial ? 'text-amber-500' : 'text-primary'}`} />
        <span className="text-sm font-medium">
          {creditsRemaining.toLocaleString()}
        </span>
        {isTrial && (
          <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
            Trial
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
