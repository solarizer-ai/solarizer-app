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
import { AlertTriangle } from "lucide-react";
import { PLAN_CREDIT_RATES } from "@/lib/nlocCalculator";
import { formatPlanName } from "@/lib/planNames";

type PlanType = keyof typeof PLAN_CREDIT_RATES;

interface DowngradeWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number;
  fromPlan: PlanType;
  toPlan: PlanType;
  onConfirm: () => void;
}

export function DowngradeWarningModal({
  open,
  onOpenChange,
  currentCredits,
  fromPlan,
  toPlan,
  onConfirm,
}: DowngradeWarningModalProps) {
  const fromPlanLabel = formatPlanName(fromPlan);
  const toPlanLabel = formatPlanName(toPlan);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Confirm Downgrade
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>
              You are about to downgrade from <span className="font-medium text-foreground">{fromPlanLabel}</span> to{" "}
              <span className="font-medium text-foreground">{toPlanLabel}</span>.
            </p>

            <p>
              Your plan will change at the end of the current billing period. Credits carry over at full value.
            </p>

            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Credits:</span>
                <span className="font-medium text-foreground">
                  {currentCredits.toLocaleString()} credits
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Downgrade:</span>
                <span className="font-medium text-primary">
                  {currentCredits.toLocaleString()} credits (unchanged)
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your nLOC-per-scan limit will change to match the {toPlanLabel} plan.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm Downgrade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
