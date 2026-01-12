import { useState } from "react";
import { Zap, Check, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POWER_UP_OPTIONS } from "@/lib/nlocCalculator";
import { usePurchasePowerUp, useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

interface PurchasePowerUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredNloc?: number;
  currentCredits?: number;
}

export function PurchasePowerUpModal({
  open,
  onOpenChange,
  requiredNloc = 0,
  currentCredits = 0,
}: PurchasePowerUpModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    POWER_UP_OPTIONS[0].nloc.toString()
  );
  const purchasePowerUp = usePurchasePowerUp();
  const { data: subscription } = useSubscription();

  const isPro = subscription?.plan === 'pro';
  const proDiscountRate = 0.20;

  const selected = POWER_UP_OPTIONS.find(
    (opt) => opt.nloc.toString() === selectedOption
  );

  const deficit = Math.max(0, requiredNloc - currentCredits);

  // Calculate discounted price for Pro users
  const getDiscountedPrice = (priceCents: number) => {
    if (isPro) {
      return Math.round(priceCents * (1 - proDiscountRate));
    }
    return priceCents;
  };

  const finalPrice = selected ? getDiscountedPrice(selected.priceCents) : 0;
  const proSavings = selected && isPro ? selected.priceCents - finalPrice : 0;

  const handlePurchase = async () => {
    if (!selected) return;

    try {
      await purchasePowerUp.mutateAsync({
        nlocAmount: selected.nloc,
        priceCents: finalPrice,
      });

      toast({
        title: "Power-Up Purchased!",
        description: `Added ${selected.nloc.toLocaleString()} nLOC to your account.`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Purchase nLOC Power-Up
          </DialogTitle>
          <DialogDescription>
            {deficit > 0 
              ? `You need ${deficit.toLocaleString()} more nLOC to run this scan.`
              : "Add more nLOC capacity to your account."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPro && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <Percent className="h-4 w-4" />
              Pro member: 20% discount applied!
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Power-Up</label>
            <Select value={selectedOption} onValueChange={setSelectedOption}>
              <p className="text-xs text-muted-foreground mb-2">
                {isPro 
                  ? "Power-up credits expire at the end of your Pro subscription period."
                  : "Power-up credits never expire and are available anytime."
                }
              </p>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {POWER_UP_OPTIONS.map((option) => {
                  const discounted = getDiscountedPrice(option.priceCents);
                  return (
                    <SelectItem key={option.nloc} value={option.nloc.toString()}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{option.nloc.toLocaleString()} nLOC</span>
                        <span className="text-muted-foreground">
                          {isPro && discounted !== option.priceCents ? (
                            <>
                              <span className="line-through mr-1">${(option.priceCents / 100).toFixed(0)}</span>
                              <span className="text-primary">${(discounted / 100).toFixed(0)}</span>
                            </>
                          ) : (
                            `$${(option.priceCents / 100).toFixed(0)}`
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">nLOC Added</span>
                <span className="font-semibold">{selected.nloc.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <div className="font-semibold">
                  {isPro && proSavings > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground mr-2">${(selected.priceCents / 100).toFixed(0)}</span>
                      <span className="text-primary">${(finalPrice / 100).toFixed(0)}</span>
                    </>
                  ) : (
                    `$${(finalPrice / 100).toFixed(0)}`
                  )}
                </div>
              </div>
              {isPro && proSavings > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span className="text-sm flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    Pro Discount (20%)
                  </span>
                  <span className="font-semibold">
                    -${(proSavings / 100).toFixed(0)}
                  </span>
                </div>
              )}
              {selected.savings > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span className="text-sm flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Bulk Savings
                  </span>
                  <span className="font-semibold">
                    ${selected.savings} (~{selected.discountPercent}%)
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePurchase}
              disabled={purchasePowerUp.isPending}
            >
              {purchasePowerUp.isPending ? "Processing..." : "Purchase Power-Up"}
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
