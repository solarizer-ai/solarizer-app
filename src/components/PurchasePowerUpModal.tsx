import { useState } from "react";
import { Zap, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePurchasePowerUp, useSubscription } from "@/hooks/useSubscription";
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
  const purchasePowerUp = usePurchasePowerUp();
  const { data: subscription } = useSubscription();

  const plan = subscription?.plan || 'starter';

  // Fixed pricing per credit based on plan
  const getPricePerCreditCents = (): number => {
    if (plan === 'business') return 500; // $5.00
    if (plan === 'pro') return 600;      // $6.00
    return 700;                           // $7.00
  };

  const pricePerCreditCents = getPricePerCreditCents();
  const pricePerCreditDollars = pricePerCreditCents / 100;

  // Calculate discount from base $7
  const getDiscountPercent = (): number => {
    if (plan === 'business') return 29;
    if (plan === 'pro') return 14;
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

  const handlePurchase = async () => {
    if (customCredits < MIN_CREDITS) {
      toast({
        title: "Minimum Purchase",
        description: `Please purchase at least ${MIN_CREDITS} credits.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await purchasePowerUp.mutateAsync({
        nlocAmount: customCredits,
        priceCents: totalPriceCents,
      });

      toast({
        title: "Power up Credits Purchased!",
        description: `Added ${customCredits.toLocaleString()} credits to your account.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const getPlanLabel = () => {
    if (plan === 'business') return 'Business';
    if (plan === 'pro') return 'Pro';
    return 'Launch';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Purchase Power up Credits
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
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold text-primary">
                ${totalPriceDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePurchase}
              disabled={purchasePowerUp.isPending || customCredits < MIN_CREDITS}
            >
              {purchasePowerUp.isPending ? "Processing..." : "Purchase Power up Credits"}
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
  );
}
