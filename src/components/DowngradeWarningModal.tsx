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
import { PLAN_CREDIT_RATES, calculateDowngradeCredits } from "@/lib/nlocCalculator";

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
  const newCredits = calculateDowngradeCredits(currentCredits, fromPlan, toPlan);
  const fromRate = PLAN_CREDIT_RATES[fromPlan] / 100;
  const toRate = PLAN_CREDIT_RATES[toPlan] / 100;
  const currentValue = currentCredits * fromRate;
  const newValue = newCredits * toRate;

  const fromPlanLabel = fromPlan === 'starter' ? 'Launch' : fromPlan.charAt(0).toUpperCase() + fromPlan.slice(1);
  const toPlanLabel = toPlan === 'starter' ? 'Launch' : toPlan.charAt(0).toUpperCase() + toPlan.slice(1);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Credit Fair Usage Policy
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>
              You are about to downgrade from <span className="font-medium text-foreground">{fromPlanLabel}</span> to{" "}
              <span className="font-medium text-foreground">{toPlanLabel}</span>.
            </p>
            
            <p>
              To preserve the monetary value of your Power up Credits, your balance will be adjusted:
            </p>

            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium text-foreground">
                  {currentCredits.toLocaleString()} credits @ ${fromRate.toFixed(2)}/credit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monetary Value:</span>
                <span className="font-medium text-foreground">${currentValue.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-border my-2" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-medium text-primary">
                  {newCredits.toLocaleString()} credits @ ${toRate.toFixed(2)}/credit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preserved Value:</span>
                <span className="font-medium text-primary">${newValue.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-sm font-medium text-foreground">
              Your {currentCredits.toLocaleString()} credits will be converted to {newCredits.toLocaleString()} credits on the new plan.
            </p>

            <p className="text-xs text-muted-foreground">
              ⓘ This conversion only applies to Power up Credits. Your monetary investment is preserved.
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
