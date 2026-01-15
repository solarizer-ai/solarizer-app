import { useState } from "react";
import { cn } from "@/lib/utils";
import { Shield, Download, Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPdfReport } from "@/lib/pdfReport";
import { useToast } from "@/hooks/use-toast";

type Grade = "A" | "B" | "C" | "D" | "F" | null;

interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SecurityScoreCardProps {
  grade: Grade;
  score: number;
  projectName: string;
  timestamp: string;
  auditId?: string;
  counts?: VulnerabilityCount;
}

const gradeConfig: Record<Exclude<Grade, null>, { color: string; label: string; description: string }> = {
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

const pendingConfig = {
  color: "text-muted-foreground",
  label: "Pending",
  description: "Analysis in progress or no results yet",
};

const SecurityScoreCard = ({ 
  grade, 
  score, 
  projectName, 
  timestamp, 
  auditId,
  counts = { critical: 0, high: 0, medium: 0, low: 0 }
}: SecurityScoreCardProps) => {
  const isPending = grade === null;
  const config = isPending ? pendingConfig : gradeConfig[grade];
  const displayScore = isPending ? 0 : score;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    if (!auditId) {
      toast({
        variant: "destructive",
        title: "Cannot download",
        description: "Audit ID is missing.",
      });
      return;
    }

    setIsDownloading(true);
    try {
      await downloadPdfReport(auditId, projectName);
      toast({
        title: "Report ready",
        description: "Use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Vulnerability matrix data
  const categories = [
    {
      label: "Critical",
      count: counts.critical,
      icon: AlertTriangle,
      bgColor: "bg-critical/10",
      textColor: "text-critical",
      borderColor: "border-critical/30",
      barColor: "bg-critical",
    },
    {
      label: "High",
      count: counts.high,
      icon: AlertTriangle,
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      borderColor: "border-destructive/30",
      barColor: "bg-destructive",
    },
    {
      label: "Medium",
      count: counts.medium,
      icon: AlertCircle,
      bgColor: "bg-warning/10",
      textColor: "text-warning",
      borderColor: "border-warning/30",
      barColor: "bg-warning",
    },
    {
      label: "Low",
      count: counts.low,
      icon: Info,
      bgColor: "bg-primary/10",
      textColor: "text-primary",
      borderColor: "border-primary/30",
      barColor: "bg-primary",
    },
  ];

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6 relative">
      {/* Desktop Download Button - Absolute positioned top-right */}
      {!isPending && auditId && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="hidden sm:flex gap-2 absolute top-4 right-4 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? "Generating..." : "Download PDF"}
        </Button>
      )}

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
        {/* Circular Progress */}
        <div className="relative w-28 h-28 lg:w-32 lg:h-32 shrink-0">
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
                isPending ? "stroke-muted" :
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
            <span className={cn("text-3xl lg:text-4xl font-bold", config.color)}>
              {isPending ? "--" : grade}
            </span>
            <span className="text-xs text-muted-foreground">
              {isPending ? "--/100" : `${score}/100`}
            </span>
          </div>
        </div>

        {/* Score Details + Vulnerability Matrix */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div>
            <div className="flex items-baseline gap-2 justify-center lg:justify-start mb-2">
              <span className={cn("text-xl lg:text-2xl font-semibold", config.color)}>
                {config.label}
              </span>
              <span className="text-sm text-muted-foreground">Security Rating</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Vulnerability Matrix - Integrated */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vulnerability Matrix
              </h4>
              <span className="text-xs text-muted-foreground">{total} findings</span>
            </div>

            {/* Visual Bar */}
            <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-4">
              {categories.map((cat) => {
                const width = total > 0 ? (cat.count / total) * 100 : 0;
                return width > 0 ? (
                  <div
                    key={cat.label}
                    className={cn("h-full transition-all duration-500", cat.barColor)}
                    style={{ width: `${width}%` }}
                  />
                ) : null;
              })}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border",
                    cat.bgColor,
                    cat.borderColor
                  )}
                >
                  <cat.icon className={cn("w-3.5 h-3.5", cat.textColor)} />
                  <span className={cn("text-sm font-medium", cat.textColor)}>{cat.count}</span>
                  <span className="text-xs text-muted-foreground">{cat.label}</span>
                </div>
              ))}
            </div>

            {/* Mobile: Button below vulnerability matrix */}
            {!isPending && auditId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex sm:hidden w-full mt-4 gap-2 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? "Generating..." : "Download PDF"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityScoreCard;