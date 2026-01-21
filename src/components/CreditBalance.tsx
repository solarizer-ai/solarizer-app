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
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }

  const creditsRemaining = credits?.credits_remaining ?? 0;

  // All plans now show credits-based display
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
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
                ? "Credits remaining. Purchase Power-Ups for additional capacity." 
                : `Launch plan: ${PLAN_LIMITS.starter.nlocPerScan} nLOC max per scan, 1 file per scan`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
