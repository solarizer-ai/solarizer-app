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

const severityColors = {
  critical: "text-critical",
  high: "text-destructive",
  medium: "text-warning",
  low: "text-primary",
  info: "text-slate-400",
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
        <div className="grid grid-cols-5 gap-2">
          {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => {
            const severityStats = stats.bySeverity[severity];
            if (severityStats.total === 0) return null;
            
            const pct = Math.round((severityStats.resolved / severityStats.total) * 100);
            
            return (
              <div key={severity} className="text-center">
                <div className={cn(
                  "text-xs font-medium capitalize mb-1",
                  severityColors[severity]
                )}>
                  {severity.slice(0, 4)}
                </div>
                <div className="text-sm font-mono">
                  {severityStats.resolved}/{severityStats.total}
                </div>
                <div className="text-xs text-muted-foreground">
                  {pct}%
                </div>
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
