import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { formatPlanName } from "@/lib/planNames";

interface PricingSpec {
  label: string;
  value: string;
}

interface PricingPlan {
  id: 'starter' | 'pro' | 'business';
  name: string;
  tagline: string;
  monthlyPrice: number;
  monthlyCredits: number;
  powerUpPrice: number;
  specs: PricingSpec[];
  popular: boolean;
  gradient: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Spark',
    tagline: 'Essentials',
    monthlyPrice: 149,
    monthlyCredits: 50,
    powerUpPrice: 2.8,
    popular: false,
    gradient: 'bg-gradient-to-br from-zinc-700 to-zinc-800',
    specs: [
      { label: 'Scan depth', value: 'Single-pass' },
      { label: 'Complexity levels', value: 'L1, L2, L3' },
      { label: 'Severity coverage', value: 'Critical, High, Medium' },
      { label: 'nLOC limit per audit', value: '500' },
      { label: 'Reports', value: 'Local markdown' },
      { label: 'Dashboard reports', value: '5 credits each' },
      { label: 'Power-up rate', value: '$2.80/credit' },
    ],
  },
  {
    id: 'pro',
    name: 'Blaze',
    tagline: 'Most Popular',
    monthlyPrice: 199,
    monthlyCredits: 50,
    powerUpPrice: 2.5,
    popular: true,
    gradient: 'bg-gradient-to-br from-orange-600 to-amber-500',
    specs: [
      { label: 'Includes', value: 'Everything in Spark' },
      { label: 'Scan depth', value: 'Deep scan' },
      { label: 'Severity coverage', value: 'All (+ Low, Info, Gas)' },
      { label: 'nLOC limit per audit', value: '3,000' },
      { label: 'Cross-contract', value: 'Included' },
      { label: 'AI validation', value: 'Included' },
      { label: 'Remediation guidance', value: 'Included' },
      { label: 'Dashboard reports', value: 'Free' },
      { label: 'Power-up rate', value: '$2.50/credit' },
    ],
  },
  {
    id: 'business',
    name: 'Inferno',
    tagline: 'Full Power',
    monthlyPrice: 499,
    monthlyCredits: 50,
    powerUpPrice: 2.2,
    popular: false,
    gradient: 'bg-gradient-to-br from-orange-700 via-red-600 to-purple-700',
    specs: [
      { label: 'Includes', value: 'Everything in Blaze' },
      { label: 'nLOC limit per audit', value: '12,000' },
      { label: 'Report sharing', value: 'Up to 5 collaborators' },
      { label: 'Remediation tracking', value: 'Included' },
      { label: 'Dashboard reports', value: 'Free' },
      { label: 'Power-up rate', value: '$2.20/credit' },
    ],
  },
];

const Pricing = () => {
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<'pro' | 'business'>('pro');
  
  const { user, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    createSubscription, 
    upgradeSubscription, 
    scheduleDowngrade, 
    cancelPendingDowngrade,
    isLoading: subscriptionActionLoading,
    isSchedulingDowngrade 
  } = useRazorpaySubscription();

  const planOrder = { starter: 1, pro: 2, business: 3 };

  const getPlanPrice = (planId: string) => {
    const plan = pricingPlans.find(p => p.id === planId);
    if (!plan) return 0;
    return plan.monthlyPrice;
  };

  const handleSubscribeClick = async (planId: 'starter' | 'pro' | 'business') => {
    await createSubscription({
      plan: planId,
      billingPeriod: 'monthly',
    });
  };

  const handleUpgrade = async () => {
    setUpgradeModalOpen(false);
    await upgradeSubscription({ toPlan: targetUpgradePlan });
  };

  const getButtonConfig = (planId: 'starter' | 'pro' | 'business') => {
    if (!user) {
      return {
        text: "Get Started",
        variant: (planId === 'pro' ? "default" : "outline") as "default" | "outline",
        action: () => navigate('/signup'),
        disabled: false,
      };
    }

    const currentPlan = subscription?.plan || null;
    if (!currentPlan) {
      return {
        text: "Subscribe",
        variant: (planId === 'pro' ? "default" : "outline") as "default" | "outline",
        action: () => handleSubscribeClick(planId),
        disabled: subscriptionActionLoading,
      };
    }

    const currentOrder = planOrder[currentPlan] || 0;
    const targetOrder = planOrder[planId] || 0;

    if (subscription?.pending_plan === planId) {
      return {
        text: "Downgrade Scheduled",
        variant: "outline" as "outline",
        action: () => cancelPendingDowngrade(),
        disabled: isSchedulingDowngrade,
        showPendingBadge: true,
        pendingDate: subscription.pending_plan_effective_date,
      };
    }

    if (currentPlan === planId) {
      if (subscription?.cancel_at_period_end) {
        return {
          text: "Cancelling",
          variant: "outline" as "outline",
          action: null,
          disabled: true,
          showCancelBadge: true,
          cancelDate: subscription.current_period_end,
        };
      }
      return {
        text: "Current Plan",
        variant: "outline" as "outline",
        action: null,
        disabled: true,
      };
    }

    if (targetOrder > currentOrder) {
      return {
        text: "Upgrade",
        variant: "default" as "default",
        action: () => {
          setTargetUpgradePlan(planId as 'pro' | 'business');
          setUpgradeModalOpen(true);
        },
        disabled: subscriptionActionLoading,
      };
    }

    return {
      text: "Switch at Renewal",
      variant: "outline" as "outline",
      action: () => {
        toast({
          title: "Plan Change",
          description: "To switch to this plan, select it when your current plan expires.",
        });
      },
      disabled: false,
    };
  };

  const getProrationAmount = () => {
    const currentPlan = subscription?.plan || 'starter';
    const currentPrice = getPlanPrice(currentPlan);
    const newPrice = getPlanPrice(targetUpgradePlan);
    return (newPrice - currentPrice) * 100;
  };

  const getDiscountedPrice = () => {
    const currentPlan = subscription?.plan || 'starter';
    const plan = pricingPlans.find(p => p.id === currentPlan);
    return plan?.powerUpPrice || 5.5;
  };

  const getCurrentPlanForModal = (): 'starter' | 'pro' | 'business' => {
    return subscription?.plan || 'starter';
  };

  const isLoading = authLoading || subscriptionLoading || creditsLoading || subscriptionActionLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 pt-32 md:pt-40 pb-16 md:pb-24">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Security That Scales
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            From solo devs to full teams. One engine, three intensities.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {pricingPlans.map((plan, index) => {
            const buttonConfig = getButtonConfig(plan.id);

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
                  plan.popular
                    ? "border-primary/50 bg-card scale-[1.02]"
                    : "border-border bg-card/50"
                )}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Gradient Banner */}
                <div className={cn("px-6 pt-6 pb-5", plan.gradient)}>
                  <p className="text-sm font-medium text-white/70 mb-1">{plan.tagline}</p>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  {plan.popular && (
                    <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </span>
                  )}
                </div>

                {/* Spec Rows */}
                <div className="flex flex-col flex-grow p-6">
                  {/* Price row */}
                  <div className="py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly price</p>
                    <p className="text-2xl font-bold">${plan.monthlyPrice}</p>
                  </div>

                  {/* Credits row */}
                  <div className="py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Credits included</p>
                    <p className="text-sm font-semibold text-foreground">{plan.monthlyCredits}</p>
                  </div>

                  {/* Feature spec rows */}
                  {plan.specs.map((spec, specIdx) => (
                    <div key={specIdx} className={cn("py-3", specIdx < plan.specs.length - 1 && "border-b border-border")}>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{spec.label}</p>
                      <p className={cn("text-sm font-semibold", spec.label === 'Includes' ? "text-primary" : "text-foreground")}>{spec.value}</p>
                    </div>
                  ))}

                  {/* Spacer */}
                  <div className="flex-grow" />

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-6"
                    size="lg"
                    variant={buttonConfig.variant}
                    disabled={buttonConfig.disabled || isLoading}
                    onClick={buttonConfig.action || undefined}
                  >
                    {isLoading ? "Loading..." : buttonConfig.text}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Credit explainer */}
        <p className="text-sm text-muted-foreground/60 text-center mt-8 mb-16">
          50 monthly credits included with every plan. Unused credits carry forward — they never expire.
        </p>

        {/* Power Up Credits Purchase Section */}
        <div
          className="max-w-lg mx-auto mb-16 p-6 rounded-2xl border border-primary/30 bg-card/50 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">Need More Credits?</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            {user && subscription
              ? `Purchase additional Power up Credits at $${getDiscountedPrice()}/credit based on your ${formatPlanName(subscription.plan)} plan.`
              : `Purchase additional Power up Credits starting at $2.20/credit with a subscription.`
            }
          </p>
          <Button
            variant="solarGlow"
            className="w-full"
            onClick={() => {
              if (!user) {
                navigate('/login?redirect=/pricing');
                return;
              }
              if (!subscription) {
                toast({
                  title: "Subscription Required",
                  description: "Please subscribe to a plan before purchasing power-up credits.",
                });
                return;
              }
              setPowerUpModalOpen(true);
            }}
          >
            {!user ? "Sign in to Purchase" : "Purchase Power up Credits"}
          </Button>
        </div>

      </main>

      <Footer />

      <PurchasePowerUpModal
        open={powerUpModalOpen}
        onOpenChange={setPowerUpModalOpen}
      />

      <UpgradeConfirmationModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        fromPlan={getCurrentPlanForModal()}
        toPlan={targetUpgradePlan}
        prorationAmount={getProrationAmount()}
        onConfirm={handleUpgrade}
        isLoading={subscriptionActionLoading}
      />
    </div>
  );
};

export default Pricing;
