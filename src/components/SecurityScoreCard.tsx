import { cn } from "@/lib/utils";
import { Shield, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type Grade = "A" | "B" | "C" | "D" | "F";

interface SecurityScoreCardProps {
  grade: Grade;
  score: number;
  projectName: string;
  timestamp: string;
  onDownloadPDF?: () => void;
}

const gradeConfig: Record<Grade, { color: string; label: string; description: string }> = {
  A: {
    color: "text-success",
    label: "Excellent",
    description: "No critical vulnerabilities detected",
  },
  B: {
    color: "text-success",
    label: "Good",
    description: "Minor issues that should be addressed",
  },
  C: {
    color: "text-warning",
    label: "Fair",
    description: "Several issues requiring attention",
  },
  D: {
    color: "text-warning",
    label: "Poor",
    description: "Significant vulnerabilities detected",
  },
  F: {
    color: "text-critical",
    label: "Critical",
    description: "Critical security flaws present",
  },
};

const SecurityScoreCard = ({ grade, score, projectName, timestamp, onDownloadPDF }: SecurityScoreCardProps) => {
  const config = gradeConfig[grade];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Protocol Health Certificate</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {projectName} • Generated {timestamp}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPDF}
          className="gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <div className="flex items-center gap-8">
        {/* Circular Progress */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-muted"
              strokeWidth="6"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              className={cn(
                "transition-all duration-1000 ease-out",
                grade === "A" || grade === "B" ? "stroke-success" :
                grade === "C" || grade === "D" ? "stroke-warning" : "stroke-critical"
              )}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-bold", config.color)}>{grade}</span>
            <span className="text-xs text-muted-foreground">{score}/100</span>
          </div>
        </div>

        {/* Score Details */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn("text-2xl font-semibold", config.color)}>
              {config.label}
            </span>
            <span className="text-sm text-muted-foreground">Security Rating</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {config.description}
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success" />
              Passed: 42 checks
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-warning" />
              Warnings: 8
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-critical" />
              Failed: 3
            </div>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Verified by ENX
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 ml-auto transition-colors">
            View on-chain proof
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityScoreCard;
