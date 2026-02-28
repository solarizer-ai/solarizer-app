import { Progress } from "@/components/ui/progress";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { useRemediationStats } from "@/hooks/useRemediationProgress";
import { Skeleton } from "@/components/ui/skeleton";

interface RemediationProgressWidgetProps {
  auditId: string;
  className?: string;
}

const severityLabels = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
  info: "INFO",
  gas: "GAS",
} as const;

const severityColors = {
  critical: "text-critical",
  high: "text-destructive",
  medium: "text-warning",
  low: "text-low",
  info: "text-slate-400",
  gas: "text-green-500",
} as const;

export function RemediationProgressWidget({ auditId, className }: RemediationProgressWidgetProps) {
  const { data: stats, isLoading } = useRemediationStats(auditId);

  if (isLoading) {
    return (
      <TerminalPanel variant="data" className={className}>
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-1.5 w-full mb-2" />
        <Skeleton className="h-3 w-24" />
      </TerminalPanel>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <TerminalPanel variant="data" className={className}>
        <TerminalDivider label="Remediation" />
        <p className="font-mono text-[12px] text-muted-foreground/50 mt-3">
          No findings to track.
        </p>
      </TerminalPanel>
    );
  }

  const criticalRemaining = stats.bySeverity.critical.total - stats.bySeverity.critical.resolved;
  const highRemaining = stats.bySeverity.high.total - stats.bySeverity.high.resolved;
  const hasUrgentRemaining = criticalRemaining > 0 || highRemaining > 0;

  return (
    <TerminalPanel variant="data" className={className}>
      <TerminalDivider
        label="Remediation"
        right={
          <span className="font-mono text-[11px] text-muted-foreground/50">
            {stats.percentage}%
          </span>
        }
      />

      {/* Progress bar */}
      <Progress value={stats.percentage} className="h-1.5 mt-3" />

      {/* Resolved count */}
      <p className="font-mono text-[12px] text-muted-foreground/50 mt-2">
        {stats.resolved} of {stats.total} resolved
      </p>

      {/* Per-severity breakdown */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] mt-2">
        {(['critical', 'high', 'medium', 'low', 'info', 'gas'] as const).map((severity) => {
          const severityStats = stats.bySeverity[severity];
          if (severityStats.total === 0) return null;

          return (
            <span key={severity} className={severityColors[severity]}>
              {severityLabels[severity]} {severityStats.resolved}/{severityStats.total}
            </span>
          );
        })}
      </div>

      {/* Urgent warning */}
      {hasUrgentRemaining && (
        <p className="font-mono text-[11px] text-warning mt-2">
          ! {criticalRemaining > 0 && `${criticalRemaining} critical`}
          {criticalRemaining > 0 && highRemaining > 0 && ' + '}
          {highRemaining > 0 && `${highRemaining} high`}
          {' '}remaining
        </p>
      )}

      {/* All resolved */}
      {stats.percentage === 100 && (
        <p className="font-mono text-[12px] text-green-400 mt-2">
          All findings resolved
        </p>
      )}
    </TerminalPanel>
  );
}
