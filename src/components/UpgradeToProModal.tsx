import { Zap, Shield, Code2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";

interface UpgradeToProModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'nloc_limit';
  currentNloc?: number;
}

export function UpgradeToProModal({ 
  open, 
  onOpenChange, 
  reason = 'nloc_limit',
  currentNloc 
}: UpgradeToProModalProps) {
  const features = [
    { icon: Shield, text: "50 credits monthly allowance" },
    { icon: Code2, text: "Up to 3,000 nLOC per audit" },
    { icon: Zap, text: "Purchase credits for larger projects" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Upgrade to Blaze
          </DialogTitle>
          <DialogDescription>
            {`Your code has ${currentNloc?.toLocaleString()} nLOC, exceeding the ${PLAN_LIMITS.starter.nlocPerScan} nLOC per audit limit for Spark.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">$199</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm">{feature.text}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 space-y-2">
            <Button className="w-full" size="lg">
              Upgrade to Blaze
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
