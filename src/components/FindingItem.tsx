import { useState } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, Info, FileCode, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium" | "low";

interface Finding {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  location: {
    file: string;
    lines: string;
  };
  code: string;
  remediation: string;
}

interface FindingItemProps {
  finding: Finding;
  isNew?: boolean;
}

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; label: string; className: string }> = {
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    className: "text-critical bg-critical/10 border-critical/20",
  },
  high: {
    icon: AlertTriangle,
    label: "High",
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium",
    className: "text-warning bg-warning/10 border-warning/20",
  },
  low: {
    icon: Info,
    label: "Low",
    className: "text-primary bg-primary/10 border-primary/20",
  },
};

// Helper function to render text with inline code formatting for backtick-wrapped text
const renderWithCodeFormatting = (text: string) => {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const FindingItem = ({ finding, isNew = false }: FindingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[finding.severity];
  const Icon = config.icon;

  return (
    <div className={cn(
      "border border-border rounded-lg overflow-hidden bg-card/50 transition-all duration-300",
      isNew && "animate-fade-in ring-2 ring-primary/30"
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Mobile: Stacked layout, Desktop: Inline layout */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Top row on mobile: Badge + Chevron */}
          <div className="flex items-center justify-between sm:contents">
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border shrink-0",
              config.className
            )}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </div>
            
            {/* Chevron - visible on mobile in top row */}
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 sm:hidden",
              isExpanded && "rotate-180"
            )} />
          </div>
          
          {/* Title - full width on mobile, can wrap to 2 lines */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate">
              {finding.title}
            </p>
          </div>

          {/* Location + Chevron (desktop only) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileCode className="w-3.5 h-3.5" />
              <span className="font-mono">{finding.location.lines}</span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </div>
          
          {/* Location on mobile - smaller, below title */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs text-muted-foreground">
            <FileCode className="w-3 h-3" />
            <span className="font-mono text-[11px]">{finding.location.lines}</span>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {renderWithCodeFormatting(finding.description)}
            </p>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Location
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-primary">{finding.location.file}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Lines {finding.location.lines}</span>
            </div>
          </div>

          {/* Affected Code */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Affected Code
            </h4>
            <div className="bg-background rounded-md border border-border p-3 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground/90">{finding.code}</pre>
            </div>
          </div>

          {/* Remediation */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-success" />
              Remediation Guide
            </h4>
            <div className="bg-success/5 border border-success/20 rounded-md p-4">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {renderWithCodeFormatting(finding.remediation)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindingItem;
