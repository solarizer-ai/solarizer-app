import { useState } from "react";
import { CheckCircle2, Circle, History, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToggleFindingResolved, useStatusHistory } from "@/hooks/useRemediationProgress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RemediationStatusToggleProps {
  findingId: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export function RemediationStatusToggle({ 
  findingId, 
  isResolved,
  resolvedAt,
  resolvedBy 
}: RemediationStatusToggleProps) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  const toggleResolved = useToggleFindingResolved();
  const { data: history, isLoading: historyLoading } = useStatusHistory(findingId);

  const handleToggle = async () => {
    if (!isResolved) {
      // Show comment input when marking as resolved
      setShowComment(true);
    } else {
      // Directly unresolve
      await toggleResolved.mutateAsync({ 
        findingId, 
        isResolved: false 
      });
    }
  };

  const handleSubmitResolve = async () => {
    await toggleResolved.mutateAsync({ 
      findingId, 
      isResolved: true,
      comment: comment.trim() || undefined
    });
    setShowComment(false);
    setComment("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Remediation Status
          </h4>
        </div>
        
        <Button
          variant={isResolved ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={toggleResolved.isPending}
          className={cn(
            "gap-2",
            isResolved && "bg-success hover:bg-success/90"
          )}
        >
          {toggleResolved.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isResolved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          {isResolved ? "Resolved" : "Mark as Resolved"}
        </Button>
      </div>

      {/* Show resolve date if resolved */}
      {isResolved && resolvedAt && (
        <p className="text-xs text-muted-foreground">
          Marked as resolved {formatDistanceToNow(new Date(resolvedAt), { addSuffix: true })}
        </p>
      )}

      {/* Comment input when marking as resolved */}
      {showComment && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <Textarea
            placeholder="Add a note about the resolution (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComment(false);
                setComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitResolve}
              disabled={toggleResolved.isPending}
              className="bg-success hover:bg-success/90"
            >
              {toggleResolved.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Confirm Resolved
            </Button>
          </div>
        </div>
      )}

      {/* Status History */}
      {history && history.length > 0 && (
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              Status History ({history.length})
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform",
                showHistory && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                history.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-start gap-2 p-2 rounded bg-muted/20 text-xs"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1 shrink-0",
                      entry.new_resolved ? "bg-success" : "bg-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground/90">
                        {entry.new_resolved ? "Marked as resolved" : "Reopened"} by{" "}
                        <span className="font-medium">{entry.user_email}</span>
                      </p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                      </p>
                      {entry.comment && (
                        <p className="mt-1 text-foreground/80 italic">"{entry.comment}"</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
