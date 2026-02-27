import { useState } from "react";
import { Zap, ArrowRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CouponInput } from "@/components/CouponInput";
import { formatPlanName } from "@/lib/planNames";

interface CouponResult {
  valid: boolean;
  coupon_id?: string;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  discount_applied_cents?: number;
  final_amount_cents?: number;
}

interface UpgradeConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromPlan: string;
  toPlan: string;
  prorationAmount: number; // in cents
  onConfirm: (couponCode?: string) => void;
  isLoading?: boolean;
}

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "Deep scan on L2+ contracts",
    "All severity levels (+ Low, Info, Gas)",
    "Up to 3,000 nLOC per audit",
    "Cross-contract analysis",
    "AI validation (false positive elimination)",
    "Remediation guidance",
    "Free dashboard report access",
  ],
  business: [
    "Everything in Blaze",
    "Up to 12,000 nLOC per audit",
    "Share reports on dashboard",
    "Invite up to 5 collaborators",
    "Comment & track remediation progress",
    "Lowest credit rate ($2.20/credit)",
  ],
};

export function UpgradeConfirmationModal({
  open,
  onOpenChange,
  fromPlan,
  toPlan,
  prorationAmount,
  onConfirm,
  isLoading = false,
}: UpgradeConfirmationModalProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const finalCents = appliedCoupon?.final_amount_cents ?? prorationAmount;
  const prorationDollars = (prorationAmount / 100).toFixed(2);
  const finalDollars = (finalCents / 100).toFixed(2);
  const features = PLAN_FEATURES[toPlan] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Upgrade to {formatPlanName(toPlan)}
          </DialogTitle>
          <DialogDescription>
            You're upgrading from {formatPlanName(fromPlan)} to {formatPlanName(toPlan)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upgrade Path Visualization */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="px-4 py-2 rounded-lg bg-muted text-sm font-medium">
              {formatPlanName(fromPlan)}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              {formatPlanName(toPlan)}
            </div>
          </div>

          {/* Proration Info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-muted-foreground">Proration (due today)</span>
              <span className={`text-2xl font-bold ${appliedCoupon ? "line-through text-muted-foreground text-lg" : ""}`}>${prorationDollars}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-success font-medium">After discount</span>
                <span className="text-2xl font-bold">${finalDollars}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This is the difference between your current plan and the new plan price.
              Your next monthly renewal will be at the full {formatPlanName(toPlan)} rate.
            </p>
          </div>

          {/* Coupon Input */}
          <CouponInput
            orderType="subscription"
            amountCents={prorationAmount}
            onApply={(result) => setAppliedCoupon(result as CouponResult | null)}
          />

          {/* Features */}
          {features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">What you'll get:</p>
              <ul className="space-y-1">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => onConfirm(appliedCoupon?.code)}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Pay $${finalDollars} & Upgrade`}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
