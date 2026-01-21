import { Clock, CheckCircle2, Loader2, AlertTriangle, XCircle, AlertOctagon, Users, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AuditStatus = "analyzing" | "secured" | "issues" | "pending" | "cancelled" | "failed";
type SecurityGrade = "A" | "B" | "C" | "D" | "F";

interface AuditCardProps {
  projectName: string;
  contractCount: number;
  grade?: SecurityGrade;
  status: AuditStatus;
  timestamp: string;
  onClick?: () => void;
  isShared?: boolean;
  hasShares?: boolean;
}

const gradeColors: Record<SecurityGrade, string> = {
  A: "text-success bg-success/10 border-success/20",
  B: "text-success bg-success/10 border-success/20",
  C: "text-warning bg-warning/10 border-warning/20",
  D: "text-warning bg-warning/10 border-warning/20",
  F: "text-critical bg-critical/10 border-critical/20",
};

const statusConfig: Record<AuditStatus, { label: string; icon: React.ReactNode; className: string }> = {
  analyzing: {
    label: "Analyzing",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: "text-primary bg-primary/10 border-primary/20",
  },
  secured: {
    label: "Secured",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "text-success bg-success/10 border-success/20",
  },
  issues: {
    label: "Issues Found",
    icon: <AlertTriangle className="w-3 h-3" />,
    className: "text-warning bg-warning/10 border-warning/20",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="w-3 h-3" />,
    className: "text-muted-foreground bg-muted border-border",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-3 h-3" />,
    className: "text-muted-foreground bg-muted border-border",
  },
  failed: {
    label: "Failed",
    icon: <AlertOctagon className="w-3 h-3" />,
    className: "text-critical bg-critical/10 border-critical/20",
  },
};

const AuditCard = ({ projectName, contractCount, grade, status, timestamp, onClick, isShared, hasShares }: AuditCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-card border border-border rounded-lg p-5 cursor-pointer",
        "hover:border-primary/30 hover:bg-card/80 transition-all duration-200",
        "hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]",
        isShared && "border-l-2 border-l-secondary"
      )}
    >
      {/* Sharing Status Badge */}
      {(isShared || hasShares) && (
        <div className={cn(
          "absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
          isShared 
            ? "bg-secondary/20 text-secondary-foreground" 
            : "bg-primary/10 text-primary border border-primary/20"
        )}>
          {isShared ? (
            <>
              <Users className="w-3 h-3" />
              Shared
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3" />
              Sharing
            </>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {projectName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {contractCount} contract{contractCount !== 1 ? "s" : ""}
          </p>
        </div>
        
        {grade && (
          <div className={cn(
            "w-10 h-10 rounded-lg border flex items-center justify-center font-semibold text-lg",
            (isShared || hasShares) && "mt-6",
            gradeColors[grade]
          )}>
            {grade}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
          statusInfo.className
        )}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default AuditCard;
