import { cn } from "@/lib/utils";


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

  const categories = [
    { label: "Critical", count: counts.critical, textColor: "text-critical", barColor: "bg-critical" },
    { label: "High", count: counts.high, textColor: "text-destructive", barColor: "bg-destructive" },
    { label: "Medium", count: counts.medium, textColor: "text-warning", barColor: "bg-warning" },
    { label: "Low", count: counts.low, textColor: "text-low", barColor: "bg-low" },
    { label: "Info", count: counts.info, textColor: "text-slate-400", barColor: "bg-slate-400" },
    { label: "Gas", count: counts.gas ?? 0, textColor: "text-green-500", barColor: "bg-green-500" },
  ];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Grade + Rating */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0",
          isPending ? "border-muted" :
          grade === "A" || grade === "B" ? "border-success" :
          grade === "C" || grade === "D" ? "border-warning" : "border-critical"
        )}>
          <span className={cn("text-lg font-bold", config.color)}>
            {isPending ? "--" : grade}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-base font-semibold", config.color)}>{config.label}</span>
          <span className="text-sm text-muted-foreground">· {total} findings</span>
        </div>
      </div>

      {/* Vulnerability Matrix Bar */}
      <div className="pt-3 border-t border-border">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Vulnerability Matrix</h4>

        <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
          {categories.map((cat) => {
            const width = total > 0 ? (cat.count / total) * 100 : 0;
            return width > 0 ? (
              <div key={cat.label} className={cn("h-full transition-all duration-500", cat.barColor)} style={{ width: `${width}%` }} />
            ) : null;
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {categories.map((cat) => (
            <span
              key={cat.label}
              onClick={() => onSeverityClick?.(cat.label.toLowerCase())}
              className={cn(
                "text-xs sm:text-sm font-medium",
                cat.textColor,
                onSeverityClick ? "cursor-pointer hover:opacity-75 transition-opacity" : ""
              )}
            >
              {cat.label} {cat.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityScoreCard;
