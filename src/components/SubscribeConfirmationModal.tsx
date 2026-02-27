import { useState } from "react";
import { Zap } from "lucide-react";
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

const PLAN_PRICES: Record<string, number> = {
  starter: 14900,
  pro: 19900,
  business: 49900,
};

interface CouponResult {
  valid: boolean;
  coupon_id?: string;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  discount_applied_cents?: number;
  final_amount_cents?: number;
}

interface SubscribeConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: "starter" | "pro" | "business";
  onConfirm: (couponCode?: string) => void;
  isLoading?: boolean;
}

export function SubscribeConfirmationModal({
  open,
  onOpenChange,
  plan,
  onConfirm,
  isLoading = false,
}: SubscribeConfirmationModalProps) {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null);

  const baseCents = PLAN_PRICES[plan] || 0;
  const finalCents = appliedCoupon?.final_amount_cents ?? baseCents;
  const baseDollars = (baseCents / 100).toFixed(2);
  const finalDollars = (finalCents / 100).toFixed(2);

  const handleConfirm = () => {
    onConfirm(appliedCoupon?.code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Subscribe to {formatPlanName(plan)}
          </DialogTitle>
          <DialogDescription>
            Review your subscription before proceeding to payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-muted-foreground">{formatPlanName(plan)} — Monthly</span>
              <span className={`text-2xl font-bold ${appliedCoupon ? "line-through text-muted-foreground text-lg" : ""}`}>
                ${baseDollars}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-success font-medium">After discount</span>
                <span className="text-2xl font-bold">${finalDollars}</span>
              </div>
            )}
          </div>

          {/* Coupon Input */}
          <CouponInput
            orderType="subscription"
            amountCents={baseCents}
            onApply={(result) => setAppliedCoupon(result as CouponResult | null)}
          />

          {/* Actions */}
          <div className="pt-2 space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Pay $${finalDollars} & Subscribe`}
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
