import { Loader2, X, AlertTriangle, FileSearch } from "lucide-react";
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
import { useScan } from "@/contexts/ScanContext";
import { useUpdateAudit, type AuditStatus } from "@/hooks/useAudits";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AnalysisInProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSessionAuditId: string | null;
  onCancel: () => void;
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
  currentSessionAuditId,
  onCancel,
}: AnalysisInProgressModalProps) => {
  const { data: activeAnalyses, isLoading } = useActiveAnalyses();
  const { realtimeFindings } = useScan();
  const updateAudit = useUpdateAudit();
  const queryClient = useQueryClient();

  // Handle cancel for current session's audit (with cleanup)
  const handleCancelCurrentSession = () => {
    onCancel();
    onOpenChange(false);
  };

  // Handle cancel for any other audit (just update DB)
  const handleCancelOtherAudit = async (auditId: string) => {
    try {
      await updateAudit.mutateAsync({
        id: auditId,
        status: "cancelled" as AuditStatus,
        is_locked: true,
      });
      
      // Invalidate both queries to ensure consistent state
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['active-analyses'] });
      
      toast.info("Analysis cancelled", {
        description: "Note: Credits used for this analysis have already been consumed.",
      });
    } catch (e) {
      toast.error("Failed to cancel analysis");
    }
  };

  // Merge realtime findings with DB counts for current session's audit
  const getEnhancedCounts = (auditId: string, dbCounts: FindingCounts): FindingCounts => {
    if (auditId !== currentSessionAuditId) return dbCounts;
    
    // Count realtime findings by severity
    const realtimeCounts: FindingCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    
    for (const finding of realtimeFindings) {
      if (finding.severity in realtimeCounts) {
        realtimeCounts[finding.severity as keyof FindingCounts]++;
      }
    }

    // Return the maximum of DB counts and realtime counts
    return {
      critical: Math.max(dbCounts.critical, realtimeCounts.critical),
      high: Math.max(dbCounts.high, realtimeCounts.high),
      medium: Math.max(dbCounts.medium, realtimeCounts.medium),
      low: Math.max(dbCounts.low, realtimeCounts.low),
      info: Math.max(dbCounts.info, realtimeCounts.info),
    };
  };

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
                {activeAnalyses.map((analysis) => {
                  const isCurrentSession = analysis.id === currentSessionAuditId;
                  const enhancedCounts = getEnhancedCounts(analysis.id, analysis.findingCounts);
                  
                  return (
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
                      <SeverityBadges counts={enhancedCounts} />

                      {/* Cancel Button - Available for all active analyses */}
                      <div className="pt-1 space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            isCurrentSession 
                              ? handleCancelCurrentSession() 
                              : handleCancelOtherAudit(analysis.id)
                          }
                          className="gap-1.5 h-8"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel Analysis
                        </Button>
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Cancelling will not refund credits</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
