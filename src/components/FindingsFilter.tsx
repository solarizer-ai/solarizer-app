import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FindingSeverity } from "@/hooks/useAudits";

interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  location?: {
    file: string;
    lines?: string;
  };
  code?: string;
  remediation?: string;
  is_resolved?: boolean;
}

interface FindingsFilterProps {
  findings: Finding[];
  onFilteredChange: (filtered: Finding[]) => void;
  hiddenSeverities?: FindingSeverity[];
  defaultSeverity?: FindingSeverity | null;
}

const severityOrder: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  gas: 5,
};

const FindingsFilter = ({ findings, onFilteredChange, hiddenSeverities = [], defaultSeverity }: FindingsFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<FindingSeverity[]>(
    defaultSeverity ? [defaultSeverity] : []
  );

  // Apply external severity filter when set from parent (e.g. ScoreCard pill click)
  useEffect(() => {
    if (defaultSeverity) {
      setSelectedSeverities([defaultSeverity]);
    }
  }, [defaultSeverity]);
  const [showResolved, setShowResolved] = useState(true);

  const allSeverities: FindingSeverity[] = ["critical", "high", "medium", "low", "info", "gas"];
  const availableSeverities = allSeverities.filter(s => !hiddenSeverities.includes(s));

  const filteredFindings = useMemo(() => {
    let result = [...findings];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.location?.file.toLowerCase().includes(query)
      );
    }

    // Filter by severity
    if (selectedSeverities.length > 0) {
      result = result.filter((f) => selectedSeverities.includes(f.severity));
    }

    // Filter by resolved status
    if (!showResolved) {
      result = result.filter((f) => !f.is_resolved);
    }

    // Sort by severity
    result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return result;
  }, [findings, searchQuery, selectedSeverities, showResolved]);

  // Track last emitted signature to prevent redundant updates
  const lastSignatureRef = useRef<string>("");

  // Update parent only when filtered results actually change
  useEffect(() => {
    const signature = filteredFindings.map(f => f.id).join(",");
    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      onFilteredChange(filteredFindings);
    }
  }, [filteredFindings, onFilteredChange]);

  const toggleSeverity = (severity: FindingSeverity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSeverities([]);
    setShowResolved(true);
  };

  const hasActiveFilters = searchQuery || selectedSeverities.length > 0 || !showResolved;

  const getSeverityColor = (severity: FindingSeverity) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20";
      case "low":
        return "bg-low/10 text-low border-low/30 hover:bg-low/20";
      case "info":
        return "bg-slate-400/10 text-slate-400 border-slate-400/30 hover:bg-slate-400/20";
      case "gas":
        return "bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20";
      default:
        return "bg-muted text-muted-foreground border-border hover:bg-muted/80";
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {allSeverities.map((severity) => {
            const isHidden = hiddenSeverities.includes(severity);
            
            if (isHidden) {
              return (
                <TooltipProvider key={severity}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        disabled
                        className="px-2 py-1 text-xs font-medium rounded-md border transition-colors capitalize bg-muted/50 text-muted-foreground/50 border-border/50 cursor-not-allowed flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span className="hidden sm:inline">{severity}</span>
                        <span className="sm:hidden">{severity.slice(0, 3)}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upgrade to Blaze to view {severity} findings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            
            return (
              <button
                key={severity}
                onClick={() => toggleSeverity(severity)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md border transition-colors capitalize",
                  selectedSeverities.includes(severity)
                    ? getSeverityColor(severity)
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                <span className="hidden sm:inline">{severity}</span>
                <span className="sm:hidden">{severity.slice(0, 3)}</span>
              </button>
            );
          })}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredFindings.length} of {findings.length} findings
        </span>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="font-normal">
                Search: "{searchQuery}"
              </Badge>
            )}
            {selectedSeverities.map((s) => (
              <Badge key={s} variant="secondary" className="font-normal capitalize">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindingsFilter;
