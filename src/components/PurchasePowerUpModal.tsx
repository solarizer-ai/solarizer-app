import { useState, useEffect, useRef } from "react";
import { CouponInput } from "@/components/CouponInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { toast } from "@/hooks/use-toast";

interface PurchasePowerUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
  currentCredits?: number;
}

const QUICK_OPTIONS = [25, 100, 500, 1000];
const MIN_CREDITS = 25;
const MAX_CREDITS = 100000;

export function PurchasePowerUpModal({
  open,
  onOpenChange,
  requiredCredits = 0,
  currentCredits = 0,
}: PurchasePowerUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(100);
  const [customInputValue, setCustomInputValue] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    final_amount_cents: number;
    discount_applied_cents: number;
  } | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const { data: subscription } = useSubscription();
  const { initiateCheckout, isLoading: checkoutLoading } =
    useRazorpayCheckout();

  const plan = subscription?.plan || "starter";
  const deficit = Math.max(0, requiredCredits - currentCredits);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    if (deficit > 0) {
      const covering = QUICK_OPTIONS.find((opt) => opt >= deficit);
      if (covering) {
        setSelectedAmount(covering);
      } else {
        setSelectedAmount("custom");
        setCustomInputValue(deficit.toString());
      }
    } else {
      setSelectedAmount(100);
    }
    setCustomInputValue((prev) =>
      deficit > Math.max(...QUICK_OPTIONS) ? deficit.toString() : prev
    );
    setShowCoupon(false);
    setAppliedCoupon(null);
  }, [open, deficit]);

  // Auto-focus custom input
  useEffect(() => {
    if (selectedAmount === "custom") {
      // Delay to allow render
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  }, [selectedAmount]);

  // Fixed pricing per credit based on plan (matches PLAN_CREDIT_RATES)
  const getPricePerCreditCents = (): number => {
    if (plan === "business") return 220; // $2.20
    if (plan === "pro") return 250; // $2.50
    return 280; // $2.80
  };

  const pricePerCreditCents = getPricePerCreditCents();
  const pricePerCreditDollars = pricePerCreditCents / 100;

  // Derive active credits from selection
  const activeCredits =
    selectedAmount === "custom"
      ? Math.min(
          Math.max(parseInt(customInputValue, 10) || 0, 0),
          MAX_CREDITS
        )
      : selectedAmount;

  const totalPriceCents = activeCredits * pricePerCreditCents;
  const finalPriceCents = appliedCoupon?.final_amount_cents ?? totalPriceCents;
  const finalPriceDollars = finalPriceCents / 100;

  const formatPrice = (dollars: number) =>
    dollars.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handlePurchaseClick = async () => {
    if (activeCredits < MIN_CREDITS) {
      toast({
        title: "Minimum Purchase",
        description: `Please purchase at least ${MIN_CREDITS} credits.`,
        variant: "destructive",
      });
      return;
    }
    await initiateCheckout({
      orderType: "power_up",
      creditsAmount: activeCredits,
      coupon_code: appliedCoupon?.code,
    });
  };

  const isValid = activeCredits >= MIN_CREDITS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            {deficit > 0
              ? `You need ${deficit.toLocaleString()} more credits to run this scan.`
              : "Top up credits for your security scans."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pill chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_OPTIONS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedAmount(amt)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedAmount === amt
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedAmount("custom")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedAmount === "custom"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom input (conditional) */}
          {selectedAmount === "custom" && (
            <div className="flex flex-col items-center gap-1">
              <Input
                ref={customInputRef}
                type="number"
                min={MIN_CREDITS}
                max={MAX_CREDITS}
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                onBlur={() => {
                  if (activeCredits < MIN_CREDITS && customInputValue !== "") {
                    setCustomInputValue(MIN_CREDITS.toString());
                  }
                }}
                className="w-32 text-center text-lg"
                placeholder={MIN_CREDITS.toString()}
              />
              {!isValid && customInputValue !== "" && (
                <p className="text-xs text-destructive">
                  Minimum {MIN_CREDITS} credits
                </p>
              )}
            </div>
          )}

          {/* Price display */}
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">
              ${formatPrice(finalPriceDollars)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCredits.toLocaleString()} credits &times; $
              {pricePerCreditDollars.toFixed(2)}/ea
            </p>
            {appliedCoupon && (
              <p className="text-sm text-green-500 mt-1">
                Coupon: &minus;$
                {formatPrice(appliedCoupon.discount_applied_cents / 100)}
              </p>
            )}
          </div>

          {/* Coupon (progressive disclosure) */}
          <div className="text-center">
            {!showCoupon ? (
              <button
                type="button"
                onClick={() => setShowCoupon(true)}
                className="text-xs text-muted-foreground underline cursor-pointer hover:text-foreground transition-colors"
              >
                Have a code?
              </button>
            ) : (
              <CouponInput
                orderType="power_up"
                amountCents={totalPriceCents}
                onApply={(r) =>
                  setAppliedCoupon(
                    r?.valid
                      ? {
                          code: r.code!,
                          final_amount_cents: r.final_amount_cents!,
                          discount_applied_cents: r.discount_applied_cents!,
                        }
                      : null
                  )
                }
              />
            )}
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePurchaseClick}
            disabled={!isValid || checkoutLoading}
          >
            {checkoutLoading
              ? "Processing..."
              : `Buy for $${formatPrice(finalPriceDollars)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
