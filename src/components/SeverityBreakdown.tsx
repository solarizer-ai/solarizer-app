import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, ShieldCheck, Fuel } from "lucide-react";

interface SeverityBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}

const SeverityBar = ({ label, count, total, color, icon }: SeverityBarProps) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded ${color} bg-opacity-10`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground capitalize">{label}</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${color}`}
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
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const { severityBreakdown } = stats;
  const total = Object.values(severityBreakdown).reduce((a, b) => a + b, 0);

  const severities = [
    { 
      key: 'critical', 
      label: 'Critical', 
      count: severityBreakdown.critical, 
      color: 'bg-red-500 text-red-500',
      icon: <ShieldAlert className="w-4 h-4" />
    },
    { 
      key: 'high', 
      label: 'High', 
      count: severityBreakdown.high, 
      color: 'bg-orange-500 text-orange-500',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    { 
      key: 'medium', 
      label: 'Medium', 
      count: severityBreakdown.medium, 
      color: 'bg-yellow-500 text-yellow-500',
      icon: <AlertCircle className="w-4 h-4" />
    },
    { 
      key: 'low', 
      label: 'Low', 
      count: severityBreakdown.low, 
      color: 'bg-blue-500 text-blue-500',
      icon: <Info className="w-4 h-4" />
    },
    { 
      key: 'info', 
      label: 'Info', 
      count: severityBreakdown.info, 
      color: 'bg-slate-400 text-slate-400',
      icon: <ShieldCheck className="w-4 h-4" />
    },
    { 
      key: 'gas', 
      label: 'Gas', 
      count: severityBreakdown.gas, 
      color: 'bg-green-500 text-green-500',
      icon: <Fuel className="w-4 h-4" />
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
              color={severity.color}
              icon={severity.icon}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
