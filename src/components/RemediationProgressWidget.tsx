import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRemediationStats } from "@/hooks/useRemediationProgress";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface RemediationProgressWidgetProps {
  auditId: string;
  className?: string;
}

const severityConfig = {
  critical: {
    dot: "bg-critical",
    bg: "bg-critical/10",
    border: "border-critical/30",
    text: "text-critical",
  },
  high: {
    dot: "bg-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
  },
  medium: {
    dot: "bg-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
  },
  low: {
    dot: "bg-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
  },
  info: {
    dot: "bg-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    text: "text-slate-400",
  },
  gas: {
    dot: "bg-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-500",
  },
};

export function RemediationProgressWidget({ auditId, className }: RemediationProgressWidgetProps) {
  const { data: stats, isLoading } = useRemediationStats(auditId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Remediation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No findings to track.</p>
        </CardContent>
      </Card>
    );
  }

  const criticalRemaining = stats.bySeverity.critical.total - stats.bySeverity.critical.resolved;
  const highRemaining = stats.bySeverity.high.total - stats.bySeverity.high.resolved;
  const hasUrgentRemaining = criticalRemaining > 0 || highRemaining > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Remediation Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-medium">
              {stats.resolved}/{stats.total} resolved ({stats.percentage}%)
            </span>
          </div>
          <Progress 
            value={stats.percentage} 
            className="h-2"
          />
        </div>

        {/* Breakdown by Severity */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {(['critical', 'high', 'medium', 'low', 'info', 'gas'] as const).map((severity) => {
            const severityStats = stats.bySeverity[severity];
            if (severityStats.total === 0) return null;
            
            const config = severityConfig[severity];
            
            return (
              <div
                key={severity}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
                  config.bg,
                  config.border
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", config.dot)} />
                <span className={cn("text-sm font-medium", config.text)}>
                  {severityStats.resolved}/{severityStats.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Urgent Warning */}
        {hasUrgentRemaining && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-foreground/90">
              {criticalRemaining > 0 && `${criticalRemaining} critical`}
              {criticalRemaining > 0 && highRemaining > 0 && ' and '}
              {highRemaining > 0 && `${highRemaining} high`}
              {' '}severity finding{(criticalRemaining + highRemaining) !== 1 ? 's' : ''} remaining
            </p>
          </div>
        )}

        {/* All Resolved Badge */}
        {stats.percentage === 100 && (
          <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <p className="text-xs text-foreground/90 font-medium">
              All findings have been resolved!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
