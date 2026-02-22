import { AlertTriangle, Calendar, CreditCard } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { formatPlanName } from "@/lib/planNames";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessUntil: Date | null;
  currentPlan: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  accessUntil,
  currentPlan,
  onConfirm,
  isLoading = false,
}: CancelSubscriptionModalProps) {

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Subscription
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to cancel your {formatPlanName(currentPlan)} subscription?
            </p>
            
            {accessUntil && (
              <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    Access until {format(accessUntil, "MMMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll continue to have full access to all features until this date.
                  No further charges will be made.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                Your remaining credits will be available until your access ends.
                You can reactivate anytime before then.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Cancelling..." : "Cancel Subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
