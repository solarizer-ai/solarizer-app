import { Zap, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSubscription, useCredits, useScanCount } from "@/hooks/useSubscription";
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
  const { data: scanCount, isLoading: scanLoading } = useScanCount();

  const isLoading = subLoading || creditsLoading || scanLoading;
  const plan = subscription?.plan || 'starter';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
    );
  }

  if (plan === 'starter') {
    const scansUsed = scanCount || 0;
    const scansRemaining = Math.max(0, PLAN_LIMITS.starter.maxScans - scansUsed);

    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
          <Zap className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                {scansRemaining} of {PLAN_LIMITS.starter.maxScans} free scans
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Starter plan includes {PLAN_LIMITS.starter.maxScans} free scans, each up to {PLAN_LIMITS.starter.nlocPerScan} nLOC.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-xs text-muted-foreground">
              Max {PLAN_LIMITS.starter.nlocPerScan} nLOC per scan
            </span>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Pro plan
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  const totalMonthly = PLAN_LIMITS.pro.monthlyNloc;
  const usagePercent = Math.min(100, (creditsUsed / totalMonthly) * 100);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border/50">
        <Zap className="h-4 w-4 text-primary" />
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                {creditsRemaining.toLocaleString()} nLOC
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Pro plan includes {totalMonthly.toLocaleString()} nLOC per month. Purchase Power-Ups for additional capacity.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-xs text-muted-foreground">remaining</span>
          </div>
          <Progress value={100 - usagePercent} className="h-1.5" />
        </div>
      </div>
    </TooltipProvider>
  );
}
