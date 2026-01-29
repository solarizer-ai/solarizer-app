import { Loader2, X, AlertTriangle } from "lucide-react";
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

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface AnalysisInProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  findings: Finding[];
  isScanning: boolean;
  onCancel: () => void;
}

const severityColors: Record<string, string> = {
  critical: "text-red-600 bg-red-500/10 border-red-500/20",
  high: "text-destructive bg-destructive/10 border-destructive/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  low: "text-primary bg-primary/10 border-primary/20",
  info: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

export const AnalysisInProgressModal = ({
  open,
  onOpenChange,
  projectName,
  findings,
  isScanning,
  onCancel,
}: AnalysisInProgressModalProps) => {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analysis in Progress</DialogTitle>
          <DialogDescription>
            Please wait for the current analysis to complete before starting a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Name with Spinner */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              Analysing "{projectName || 'Project'}"
            </span>
          </div>

          {/* Findings Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Findings Discovered ({findings.length})
            </h4>

            {findings.length > 0 ? (
              <ScrollArea className="h-[200px] border border-border rounded-lg">
                <div className="p-2 space-y-1.5">
                  {findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="flex items-center gap-2 p-2 bg-background rounded-md"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize text-xs px-2 py-0.5 flex-shrink-0",
                          severityColors[finding.severity]
                        )}
                      >
                        {finding.severity}
                      </Badge>
                      <span className="text-sm text-foreground truncate">
                        {finding.title}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[200px] border border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Scanning for vulnerabilities...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
            {isScanning && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2 w-full sm:w-auto"
                >
                  <X className="w-4 h-4" />
                  Cancel Analysis
                </Button>
                <div className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Cancelling will not refund credits</span>
                </div>
              </>
            )}
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
