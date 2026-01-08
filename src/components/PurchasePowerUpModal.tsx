import { useState } from "react";
import { Zap, Check } from "lucide-react";
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
import { usePurchasePowerUp } from "@/hooks/useSubscription";
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

  const selected = POWER_UP_OPTIONS.find(
    (opt) => opt.nloc.toString() === selectedOption
  );

  const deficit = Math.max(0, requiredNloc - currentCredits);

  const handlePurchase = async () => {
    if (!selected) return;

    try {
      await purchasePowerUp.mutateAsync({
        nlocAmount: selected.nloc,
        priceCents: selected.priceCents,
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Power-Up</label>
            <Select value={selectedOption} onValueChange={setSelectedOption}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {POWER_UP_OPTIONS.map((option) => (
                  <SelectItem key={option.nloc} value={option.nloc.toString()}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{option.nloc.toLocaleString()} nLOC</span>
                      <span className="text-muted-foreground">
                        ${(option.priceCents / 100).toFixed(0)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
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
                <span className="font-semibold">${(selected.priceCents / 100).toFixed(0)}</span>
              </div>
              {selected.savings > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span className="text-sm flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    You Save
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
