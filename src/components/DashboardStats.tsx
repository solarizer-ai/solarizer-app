import { Shield, Bug, Code2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
}

const StatCard = ({ icon, label, value, subValue, iconColor = "text-primary" }: StatCardProps) => (
  <Card className="relative overflow-hidden group hover:border-primary/30 transition-colors">
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg bg-primary/10 ${iconColor}`}>
          {icon}
        </div>
      </div>
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </CardContent>
  </Card>
);

const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const DashboardStats = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon={<Shield className="w-5 h-5" />}
        label="Total Contracts"
        value={stats.totalContractsScanned}
        subValue="files scanned"
      />
      <StatCard
        icon={<Bug className="w-5 h-5" />}
        label="Vulnerabilities"
        value={stats.totalVulnerabilitiesFound}
        subValue="issues found"
        iconColor="text-destructive"
      />
      <StatCard
        icon={<Code2 className="w-5 h-5" />}
        label="Lines Analyzed"
        value={stats.totalNlocAnalyzed}
        subValue="total nLOC"
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Avg. Score"
        value={stats.averageSecurityScore > 0 ? `${stats.averageSecurityScore}%` : '--'}
        subValue="security rating"
        iconColor="text-success"
      />
    </div>
  );
};
