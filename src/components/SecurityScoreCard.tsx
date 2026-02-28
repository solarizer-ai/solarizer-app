import { cn } from "@/lib/utils";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";

type Grade = "A" | "B" | "C" | "D" | "F" | null;

interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  gas?: number;
}

interface SecurityScoreCardProps {
  grade: Grade;
  projectName: string;
  timestamp: string;
  auditId?: string;
  counts?: VulnerabilityCount;
  onSeverityClick?: (severity: string) => void;
}

const gradeConfig: Record<Exclude<Grade, null>, { color: string; label: string; description: string }> = {
  A: { color: "text-success", label: "Excellent", description: "No critical vulnerabilities detected" },
  B: { color: "text-success", label: "Good", description: "Minor issues that should be addressed" },
  C: { color: "text-warning", label: "Fair", description: "Several issues requiring attention" },
  D: { color: "text-warning", label: "Poor", description: "Significant vulnerabilities detected" },
  F: { color: "text-critical", label: "Critical", description: "Critical security flaws present" },
};

const pendingConfig = {
  color: "text-muted-foreground",
  label: "Pending",
  description: "Analysis in progress or no results yet",
};

const VULN_CATEGORIES = [
  { key: "critical", label: "Critical", textColor: "text-critical", barColor: "bg-critical" },
  { key: "high", label: "High", textColor: "text-destructive", barColor: "bg-destructive" },
  { key: "medium", label: "Medium", textColor: "text-warning", barColor: "bg-warning" },
  { key: "low", label: "Low", textColor: "text-low", barColor: "bg-low" },
  { key: "info", label: "Info", textColor: "text-slate-400", barColor: "bg-slate-400" },
  { key: "gas", label: "Gas", textColor: "text-green-500", barColor: "bg-green-500" },
] as const;

const SecurityScoreCard = ({
  grade,
  projectName,
  timestamp,
  auditId,
  counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 },
  onSeverityClick,
}: SecurityScoreCardProps) => {
  const isPending = grade === null;
  const config = isPending ? pendingConfig : gradeConfig[grade];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <TerminalPanel variant="hero" title="solarizer — security report">
      {/* Security Assessment */}
      <TerminalDivider label="Security Assessment" className="mb-5" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
        {/* Massive mono grade */}
        <span className={cn("font-mono text-[64px] sm:text-[80px] font-bold leading-none", config.color)}>
          {grade ?? '--'}
        </span>

        {/* Rating text */}
        <div className="text-center sm:text-left sm:pt-2">
          <span className={cn("text-lg font-semibold", config.color)}>{config.label}</span>
          <p className="text-sm text-muted-foreground">Security Rating</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </div>
      </div>

      {/* Vulnerability Matrix */}
      <TerminalDivider
        label="Vulnerability Matrix"
        right={<span className="text-muted-foreground/60">{total} findings</span>}
        className="mb-3"
      />

      {/* Stacked bar */}
      <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
        {VULN_CATEGORIES.map((cat) => {
          const count = counts[cat.key as keyof VulnerabilityCount] ?? 0;
          const width = total > 0 ? (count / total) * 100 : 0;
          return width > 0 ? (
            <div key={cat.key} className={cn("h-full transition-all duration-500", cat.barColor)} style={{ width: `${width}%` }} />
          ) : null;
        })}
      </div>

      {/* Compact inline monospace counts */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px]">
        {VULN_CATEGORIES.map((cat) => {
          const count = counts[cat.key as keyof VulnerabilityCount] ?? 0;
          const abbrev = cat.label === "Critical" ? cat.label.substring(0, 4).toUpperCase() : cat.label.substring(0, 3).toUpperCase();
          return (
            <button
              key={cat.key}
              onClick={() => onSeverityClick?.(cat.key)}
              className={cn(
                "hover:opacity-75 transition-opacity",
                cat.textColor,
                onSeverityClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              {abbrev} {count}
            </button>
          );
        })}
      </div>
    </TerminalPanel>
  );
};

export default SecurityScoreCard;
