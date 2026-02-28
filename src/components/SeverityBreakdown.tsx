import { useDashboardStats } from "@/hooks/useDashboardStats";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";

const SEVERITIES = [
  { key: "critical", label: "CRITICAL", textColor: "text-critical", bgColor: "bg-critical" },
  { key: "high", label: "HIGH", textColor: "text-destructive", bgColor: "bg-destructive" },
  { key: "medium", label: "MEDIUM", textColor: "text-warning", bgColor: "bg-warning" },
  { key: "low", label: "LOW", textColor: "text-low", bgColor: "bg-low" },
  { key: "info", label: "INFO", textColor: "text-slate-400", bgColor: "bg-slate-400" },
  { key: "gas", label: "GAS", textColor: "text-green-500", bgColor: "bg-green-500" },
] as const;

type SeverityKey = (typeof SEVERITIES)[number]["key"];

export const SeverityBreakdown = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <TerminalPanel variant="data">
        <TerminalDivider label="Severity Distribution" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-[58px] animate-pulse bg-white/[0.03] rounded" />
              <div className="h-3 w-6 animate-pulse bg-white/[0.03] rounded" />
              <div className="h-3 flex-1 animate-pulse bg-white/[0.03] rounded" />
              <div className="h-3 w-9 animate-pulse bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      </TerminalPanel>
    );
  }

  const { severityBreakdown } = stats;
  const total = Object.values(severityBreakdown).reduce((a, b) => a + b, 0);

  return (
    <TerminalPanel variant="data">
      <TerminalDivider label="Severity Distribution" />
      <div className="mt-3 space-y-0.5">
        {total === 0 ? (
          <p className="text-muted-foreground/40 font-mono text-[12px] text-center py-4">
            No findings yet
          </p>
        ) : (
          SEVERITIES.map(({ key, label, textColor, bgColor }) => {
            const count = severityBreakdown[key as SeverityKey];
            const pct = Math.round((count / total) * 100);

            return (
              <div key={key} className="flex items-center gap-2 font-mono text-[12px] leading-[1.7]">
                <span className={`w-[58px] uppercase text-[11px] font-medium shrink-0 ${textColor}`}>
                  {label}
                </span>
                <span className="w-6 text-right text-muted-foreground/70">
                  {count}
                </span>
                <div className="flex-1 h-1.5 bg-white/[0.03] rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${bgColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-muted-foreground/30 text-[10px]">
                  {pct}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </TerminalPanel>
  );
};
