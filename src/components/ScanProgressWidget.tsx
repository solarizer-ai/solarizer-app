import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Shield,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface ScanProgressWidgetProps {
  isVisible: boolean;
  projectName: string;
  findings: Finding[];
  auditStatus: 'pending' | 'analyzing' | 'secured' | 'issues' | null;
  onCancel: () => void;
  onViewResults: () => void;
  onClose: () => void;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-warning text-warning-foreground';
    case 'low': return 'bg-blue-500 text-white';
    case 'info': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const ScanProgressWidget = ({
  isVisible,
  projectName,
  findings,
  auditStatus,
  onCancel,
  onViewResults,
  onClose,
}: ScanProgressWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const prevFindingsCountRef = useRef(0);
  const hasShownCompleteToastRef = useRef(false);

  // Count findings by severity
  const findingCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
  };
  const totalFindings = findings.length;

  const isComplete = auditStatus === 'secured' || auditStatus === 'issues';
  const isScanning = auditStatus === 'analyzing' || auditStatus === 'pending';

  // Notify on new findings (only for critical/high)
  useEffect(() => {
    if (findings.length > prevFindingsCountRef.current && prevFindingsCountRef.current > 0) {
      const newFinding = findings[findings.length - 1];
      if (newFinding.severity === 'critical' || newFinding.severity === 'high') {
        toast.warning(`New ${newFinding.severity} finding`, {
          description: newFinding.title.substring(0, 60) + (newFinding.title.length > 60 ? '...' : ''),
          duration: 3000,
        });
      }
    }
    prevFindingsCountRef.current = findings.length;
  }, [findings]);

  // Notify on completion
  useEffect(() => {
    if (isComplete && !hasShownCompleteToastRef.current) {
      hasShownCompleteToastRef.current = true;
      toast.success("Analysis complete!", {
        description: `Found ${totalFindings} ${totalFindings === 1 ? 'issue' : 'issues'}`,
        action: {
          label: "View Results",
          onClick: onViewResults,
        },
        duration: 8000,
      });
    }
  }, [isComplete, totalFindings, onViewResults]);

  // Reset toast ref when scan starts again
  useEffect(() => {
    if (auditStatus === 'analyzing') {
      hasShownCompleteToastRef.current = false;
    }
  }, [auditStatus]);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-80" : "w-auto"
      )}
    >
      <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isScanning ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            ) : isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : null}
            
            {isExpanded ? (
              <span className="text-sm font-medium text-foreground truncate">
                {isScanning ? "Analyzing..." : "Analysis Complete"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {isScanning ? "Scanning..." : "Complete"}
                </span>
                {totalFindings > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {totalFindings} {totalFindings === 1 ? 'finding' : 'findings'}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* Project Name */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{projectName}</span>
            </div>

            {/* Finding Counts */}
            {totalFindings > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {findingCounts.critical > 0 && (
                  <Badge className={cn("gap-1 text-xs", getSeverityColor('critical'))}>
                    <AlertCircle className="w-3 h-3" />
                    {findingCounts.critical}
                  </Badge>
                )}
                {findingCounts.high > 0 && (
                  <Badge className={cn("gap-1 text-xs", getSeverityColor('high'))}>
                    <AlertCircle className="w-3 h-3" />
                    {findingCounts.high}
                  </Badge>
                )}
                {findingCounts.medium > 0 && (
                  <Badge className={cn("gap-1 text-xs", getSeverityColor('medium'))}>
                    <AlertTriangle className="w-3 h-3" />
                    {findingCounts.medium}
                  </Badge>
                )}
                {findingCounts.low > 0 && (
                  <Badge className={cn("gap-1 text-xs", getSeverityColor('low'))}>
                    <AlertTriangle className="w-3 h-3" />
                    {findingCounts.low}
                  </Badge>
                )}
                {findingCounts.info > 0 && (
                  <Badge className={cn("gap-1 text-xs", getSeverityColor('info'))}>
                    <Info className="w-3 h-3" />
                    {findingCounts.info}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isScanning ? "Waiting for findings..." : "No issues found"}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {isScanning ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewResults();
                    }}
                    className="gap-1.5 text-xs h-7 flex-1"
                  >
                    <Eye className="w-3 h-3" />
                    View Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="h-7 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanProgressWidget;
