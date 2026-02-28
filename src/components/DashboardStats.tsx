import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { KPIStat } from "@/components/ui/KPIStat";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const getScoreColor = (score: number): string | undefined => {
  if (score === 0) return undefined;
  if (score > 70) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-critical";
};

const VerticalDivider = () => (
  <div className="w-px h-12 bg-white/[0.05] hidden sm:block" />
);

const LoadingPlaceholder = () => (
  <div className="h-10 w-20 animate-pulse bg-white/[0.03] rounded" />
);

export const DashboardStats = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <TerminalPanel variant="data">
        <TerminalDivider label="Overview" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-around gap-6 sm:gap-0 mt-3">
          <LoadingPlaceholder />
          <VerticalDivider />
          <LoadingPlaceholder />
          <VerticalDivider />
          <LoadingPlaceholder />
        </div>
      </TerminalPanel>
    );
  }

  const score = stats.averageSecurityScore;

  return (
    <TerminalPanel variant="data">
      <TerminalDivider label="Overview" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-around gap-6 sm:gap-0 mt-3">
        <KPIStat
          value={stats.totalContractsScanned.toLocaleString()}
          label="contracts"
          subLabel="scanned"
        />
        <VerticalDivider />
        <KPIStat
          value={stats.totalVulnerabilitiesFound.toLocaleString()}
          label="vulnerabilities"
          subLabel="found"
        />
        <VerticalDivider />
        <KPIStat
          value={score > 0 ? `${score}%` : "--"}
          label="avg score"
          subLabel="rating"
          valueClassName={getScoreColor(score)}
        />
      </div>
    </TerminalPanel>
  );
};
