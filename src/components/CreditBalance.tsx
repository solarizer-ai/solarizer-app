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
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  const isLoading = subLoading || creditsLoading;
  const plan = subscription?.plan || 'starter';
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {creditsRemaining.toLocaleString()}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>
              {isPaid 
                ? "Credits remaining. Purchase more for additional capacity." 
                : `Spark plan: ${PLAN_LIMITS.starter.nlocPerScan} nLOC per audit max, 1 file per scan`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
