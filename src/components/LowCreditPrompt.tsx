import { useState } from "react";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LowCreditPromptProps {
  creditsRemaining: number;
  onPurchase: () => void;
}

export function LowCreditPrompt({ creditsRemaining, onPurchase }: LowCreditPromptProps) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('lowCreditPromptDismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('lowCreditPromptDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="relative p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-8">
        <div className="flex items-start gap-3 flex-1">
          <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Running low on credits!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You have {creditsRemaining} credits remaining.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onPurchase} className="gap-2 flex-shrink-0">
          <Zap className="w-3.5 h-3.5" />
          Purchase Credits
        </Button>
      </div>
    </div>
  );
}
