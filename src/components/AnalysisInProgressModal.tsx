import { Loader2, FileSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useActiveAnalyses, type FindingCounts } from "@/hooks/useActiveAnalyses";

interface AnalysisInProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityConfig: { key: keyof FindingCounts; label: string; className: string }[] = [
  { key: 'critical', label: 'Critical', className: 'text-red-600 bg-red-500/10 border-red-500/20' },
  { key: 'high', label: 'High', className: 'text-destructive bg-destructive/10 border-destructive/20' },
  { key: 'medium', label: 'Medium', className: 'text-warning bg-warning/10 border-warning/20' },
  { key: 'low', label: 'Low', className: 'text-primary bg-primary/10 border-primary/20' },
];

const SeverityBadges = ({ counts }: { counts: FindingCounts }) => {
  const hasAnyFindings = Object.values(counts).some(c => c > 0);
  
  if (!hasAnyFindings) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Scanning for vulnerabilities...
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {severityConfig.map(({ key, label, className }) => {
        const count = counts[key];
        if (count === 0) return null;
        return (
          <Badge
            key={key}
            variant="outline"
            className={cn("text-xs px-2 py-0.5", className)}
          >
            {label}: {count}
          </Badge>
        );
      })}
    </div>
  );
};

export const AnalysisInProgressModal = ({
  open,
  onOpenChange,
}: AnalysisInProgressModalProps) => {
  const { data: activeAnalyses, isLoading } = useActiveAnalyses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analyses in Progress</DialogTitle>
          <DialogDescription>
            Please wait for current analyses to complete before starting a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : activeAnalyses && activeAnalyses.length > 0 ? (
            <ScrollArea className="max-h-[350px] overflow-auto">
              <div className="space-y-3 pr-4">
                {activeAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-3 bg-muted/50 rounded-lg border border-border space-y-2"
                  >
                    {/* Project Name with Spinner */}
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {analysis.project_name}
                      </span>
                    </div>

                    {/* Severity Counts */}
                    <SeverityBadges counts={analysis.findingCounts} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileSearch className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No analyses are currently running.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Run Analysis" to start one.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
