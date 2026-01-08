import { useState, useMemo, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

const severityOrder: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const FindingsFilter = ({ findings, onFilteredChange }: FindingsFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<FindingSeverity[]>([]);
  const [showResolved, setShowResolved] = useState(true);

  const severities: FindingSeverity[] = ["critical", "high", "medium", "low", "info"];

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

  // Update parent when filtered changes
  useEffect(() => {
    onFilteredChange(filteredFindings);
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
        return "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20";
      case "info":
        return "bg-muted text-muted-foreground border-border hover:bg-muted/80";
    }
  };

  return (
    <div className="space-y-3">
      {/* Search and Filter Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {severities.map((severity) => (
            <button
              key={severity}
              onClick={() => toggleSeverity(severity)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors capitalize",
                selectedSeverities.includes(severity)
                  ? getSeverityColor(severity)
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {severity}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground h-8"
          >
            Clear filters
          </Button>
        )}
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