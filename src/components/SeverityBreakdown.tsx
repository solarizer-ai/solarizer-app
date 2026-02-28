import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, ShieldCheck, Fuel } from "lucide-react";

interface SeverityBarProps {
  label: string;
  count: number;
  total: number;
  iconColor: string;
  barColor: string;
  icon: React.ReactNode;
}

const SeverityBar = ({ label, count, total, iconColor, barColor, icon }: SeverityBarProps) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground capitalize">{label}</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(percentage, count > 0 ? 5 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const SeverityBreakdown = () => {
  const { stats, isLoading } = useDashboardStats();
  
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { severityBreakdown } = stats;
  const total = Object.values(severityBreakdown).reduce((a, b) => a + b, 0);

  const severities = [
    {
      key: 'critical',
      label: 'Critical',
      count: severityBreakdown.critical,
      iconColor: 'bg-critical/10 text-critical',
      barColor: 'bg-critical',
      icon: <ShieldAlert className="w-4 h-4" />
    },
    {
      key: 'high',
      label: 'High',
      count: severityBreakdown.high,
      iconColor: 'bg-destructive/10 text-destructive',
      barColor: 'bg-destructive',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      key: 'medium',
      label: 'Medium',
      count: severityBreakdown.medium,
      iconColor: 'bg-warning/10 text-warning',
      barColor: 'bg-warning',
      icon: <AlertCircle className="w-4 h-4" />
    },
    {
      key: 'low',
      label: 'Low',
      count: severityBreakdown.low,
      iconColor: 'bg-low/10 text-low',
      barColor: 'bg-low',
      icon: <Info className="w-4 h-4" />
    },
    {
      key: 'info',
      label: 'Info',
      count: severityBreakdown.info,
      iconColor: 'bg-slate-400/10 text-slate-400',
      barColor: 'bg-slate-400',
      icon: <ShieldCheck className="w-4 h-4" />
    },
    {
      key: 'gas',
      label: 'Gas',
      count: severityBreakdown.gas,
      iconColor: 'bg-green-500/10 text-green-500',
      barColor: 'bg-green-500',
      icon: <Fuel className="w-4 h-4" />
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Severity Distribution</h4>
      <div className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No findings yet
          </p>
        ) : (
          severities.map(severity => (
            <SeverityBar
              key={severity.key}
              label={severity.label}
              count={severity.count}
              total={total}
              iconColor={severity.iconColor}
              barColor={severity.barColor}
              icon={severity.icon}
            />
          ))
        )}
      </div>
    </div>
  );
};
