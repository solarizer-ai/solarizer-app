import { Lock, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeatureLockedOverlayProps {
  featureName: string;
  requiredPlan: 'pro' | 'business';
  description?: string;
  onUpgrade?: () => void;
  className?: string;
  variant?: 'card' | 'inline' | 'banner';
}

export function FeatureLockedOverlay({
  featureName,
  requiredPlan,
  description,
  onUpgrade,
  className,
  variant = 'card',
}: FeatureLockedOverlayProps) {
  const isPro = requiredPlan === 'pro';
  const planName = isPro ? 'Blaze' : 'Inferno';
  const PlanIcon = isPro ? Zap : Building2;
  const planColor = isPro ? 'text-primary' : 'text-purple-500';
  const planBgColor = isPro ? 'bg-primary/10' : 'bg-purple-500/10';
  const planBorderColor = isPro ? 'border-primary/20' : 'border-purple-500/20';

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Lock className="w-3.5 h-3.5" />
        <span>
          {featureName} requires{' '}
          <button 
            onClick={onUpgrade} 
            className={cn("font-medium hover:underline", planColor)}
          >
            {planName}
          </button>
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border",
        planBgColor,
        planBorderColor,
        className
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", planBgColor)}>
            <Lock className={cn("w-4 h-4", planColor)} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {featureName} is a {planName} feature
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={onUpgrade} className="shrink-0">
          <PlanIcon className="w-3.5 h-3.5 mr-1.5" />
          Upgrade to {planName}
        </Button>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-lg border text-center",
      planBgColor,
      planBorderColor,
      className
    )}>
      <div className={cn("p-3 rounded-full mb-4", planBgColor)}>
        <Lock className={cn("w-6 h-6", planColor)} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {featureName}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {description || `Upgrade to ${planName} to unlock this feature.`}
      </p>
      <Button onClick={onUpgrade}>
        <PlanIcon className="w-4 h-4 mr-2" />
        Upgrade to {planName}
      </Button>
    </div>
  );
}
