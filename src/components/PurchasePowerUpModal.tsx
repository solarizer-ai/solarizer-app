import { useState } from "react";
import { Zap, Percent } from "lucide-react";
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

const QUICK_OPTIONS = [500, 1000, 2500, 5000];
const MIN_CREDITS = 100;
const MAX_CREDITS = 100000;

export function PurchasePowerUpModal({
  open,
  onOpenChange,
  requiredCredits = 0,
  currentCredits = 0,
}: PurchasePowerUpModalProps) {
  const [customCredits, setCustomCredits] = useState<number>(1000);
  const [inputValue, setInputValue] = useState<string>("1000");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; final_amount_cents: number; discount_applied_cents: number } | null>(null);
  const { data: subscription } = useSubscription();
  const { initiateCheckout, isLoading: checkoutLoading } = useRazorpayCheckout();

  const plan = subscription?.plan || 'starter';

  // Fixed pricing per credit based on plan (matches PLAN_CREDIT_RATES)
  const getPricePerCreditCents = (): number => {
    if (plan === 'business') return 220; // $2.20
    if (plan === 'pro') return 250;      // $2.50
    return 280;                           // $2.80
  };

  const pricePerCreditCents = getPricePerCreditCents();
  const pricePerCreditDollars = pricePerCreditCents / 100;

  // Calculate discount from base $2.80
  const getDiscountPercent = (): number => {
    if (plan === 'business') return 21;
    if (plan === 'pro') return 11;
    return 0;
  };

  const discountPercent = getDiscountPercent();
  const deficit = Math.max(0, requiredCredits - currentCredits);

  const totalPriceCents = customCredits * pricePerCreditCents;
  const totalPriceDollars = totalPriceCents / 100;

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setCustomCredits(Math.min(Math.max(parsed, 0), MAX_CREDITS));
    }
  };

  const handleInputBlur = () => {
    // Validate and correct on blur
    let corrected = customCredits;
    if (customCredits < MIN_CREDITS) corrected = MIN_CREDITS;
    if (customCredits > MAX_CREDITS) corrected = MAX_CREDITS;
    setCustomCredits(corrected);
    setInputValue(corrected.toString());
  };

  const handleQuickSelect = (amount: number) => {
    setCustomCredits(amount);
    setInputValue(amount.toString());
  };

  const handlePurchaseClick = async () => {
    if (customCredits < MIN_CREDITS) {
      toast({
        title: "Minimum Purchase",
        description: `Please purchase at least ${MIN_CREDITS} credits.`,
        variant: "destructive",
      });
      return;
    }
    await initiateCheckout({
      orderType: "power_up",
      creditsAmount: customCredits,
      coupon_code: appliedCoupon?.code,
    });
  };

  const getPlanLabel = () => {
    if (plan === 'business') return 'Inferno';
    if (plan === 'pro') return 'Blaze';
    return 'Spark';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Purchase Credits
            </DialogTitle>
            <DialogDescription>
              {deficit > 0 
                ? `You need ${deficit.toLocaleString()} more credits to run this scan.`
                : "Add more credits to fuel your security scans."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Discount Banner */}
            {discountPercent > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                <Percent className="h-4 w-4" />
                {getPlanLabel()} member: ${pricePerCreditDollars}/credit applied!
              </div>
            )}

            {/* Custom Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter Credits Amount</label>
              <Input
                type="number"
                min={MIN_CREDITS}
                max={MAX_CREDITS}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                className="text-lg font-semibold text-center"
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground">
                Minimum: {MIN_CREDITS.toLocaleString()} credits
              </p>
            </div>

            {/* Quick Select Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Quick Select</label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_OPTIONS.map((amount) => (
                  <Button
                    key={amount}
                    variant={customCredits === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSelect(amount)}
                    className="text-xs"
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credits</span>
                <span className="font-semibold">{customCredits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Price</span>
                <span className="font-semibold">${pricePerCreditDollars.toFixed(2)}/credit</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-primary text-sm">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {getPlanLabel()} Discount
                  </span>
                  <span className="font-medium">~{discountPercent}% off</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex items-center justify-between text-success text-sm">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span className="font-medium">−${(appliedCoupon.discount_applied_cents / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-primary">
                  ${((appliedCoupon?.final_amount_cents ?? totalPriceCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Coupon Code */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Have a coupon?</p>
              <CouponInput
                orderType="power_up"
                amountCents={totalPriceCents}
                onApply={(r) => setAppliedCoupon(
                  r?.valid ? { code: r.code!, final_amount_cents: r.final_amount_cents!, discount_applied_cents: r.discount_applied_cents! } : null
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchaseClick}
                disabled={checkoutLoading || customCredits < MIN_CREDITS}
              >
                {checkoutLoading ? "Processing..." : "Purchase Credits"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
