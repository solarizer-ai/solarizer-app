import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { DowngradeWarningModal } from "@/components/DowngradeWarningModal";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { formatPlanName } from "@/lib/planNames";

interface PricingFeature {
  text: string;
  included: boolean;
  grayed?: boolean;
  isHeader?: boolean;
}

interface PricingPlan {
  id: 'starter' | 'pro' | 'business';
  name: string;
  label: string;
  monthlyPrice: number;
  monthlyCredits: number;
  powerUpPrice: number;
  features: PricingFeature[];
  popular: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Spark',
    label: 'Essentials',
    monthlyPrice: 149,
    monthlyCredits: 50,
    powerUpPrice: 2.8,
    popular: false,
    features: [
      { text: 'Single-pass vulnerability scanning', included: true },
      { text: 'All complexity levels (L1, L2, L3)', included: true },
      { text: 'Critical, High & Medium findings', included: true },
      { text: 'Up to 500 nLOC per audit', included: true },
      { text: 'Local markdown report', included: true },
      { text: 'Dashboard report access (5 credits each)', included: true },
      { text: 'No deep scan', included: false, grayed: true },
      { text: 'No cross-contract analysis', included: false, grayed: true },
      { text: 'No remediation guidance', included: false, grayed: true },
    ],
  },
  {
    id: 'pro',
    name: 'Blaze',
    label: 'Most Popular',
    monthlyPrice: 199,
    monthlyCredits: 50,
    powerUpPrice: 2.5,
    popular: true,
    features: [
      { text: 'Everything in Spark, plus:', included: true, isHeader: true },
      { text: 'Deep scan on L2+ contracts (two-pass)', included: true },
      { text: 'All severity levels (+ Low, Info, Gas)', included: true },
      { text: 'Up to 3,000 nLOC per audit', included: true },
      { text: 'Cross-contract analysis', included: true },
      { text: 'AI validation (false positive elimination)', included: true },
      { text: 'Remediation guidance', included: true },
      { text: 'Free dashboard report access', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Inferno',
    label: 'Full Power',
    monthlyPrice: 499,
    monthlyCredits: 50,
    powerUpPrice: 2.2,
    popular: false,
    features: [
      { text: 'Everything in Blaze, plus:', included: true, isHeader: true },
      { text: 'Up to 12,000 nLOC per audit', included: true },
      { text: 'Share reports on dashboard', included: true },
      { text: 'Invite up to 5 collaborators', included: true },
      { text: 'Comment & track remediation progress', included: true },
      { text: 'Lowest power-up rate ($2.20/credit)', included: true },
    ],
  },
];

// FAQ moved to Docs page

const Pricing = () => {
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<'starter' | 'pro' | 'business'>('starter');
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

  // Price lookup
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
    // Not logged in
    if (!user) {
      return {
        text: "Get Started",
        variant: (planId === 'pro' ? "default" : "outline") as "default" | "outline",
        action: () => navigate('/signup'),
        disabled: false,
      };
    }

    // Logged in but no subscription
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

    // Check for pending downgrade to this plan
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

    // Same plan
    if (currentPlan === planId) {
      // Check if cancellation is pending
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

    // Upgrade
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

    // Downgrade
    return {
      text: "Downgrade",
      variant: "outline" as "outline",
      action: () => {
        setTargetDowngradePlan(planId);
        setDowngradeModalOpen(true);
      },
      disabled: isSchedulingDowngrade,
    };
  };

  const handleConfirmDowngrade = () => {
    setDowngradeModalOpen(false);
    scheduleDowngrade(targetDowngradePlan);
  };

  const getProrationAmount = () => {
    const currentPlan = subscription?.plan || 'starter';
    const currentPrice = getPlanPrice(currentPlan);
    const newPrice = getPlanPrice(targetUpgradePlan);
    return (newPrice - currentPrice) * 100; // Convert to cents
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
        <div className="text-center mb-12">
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
                  "relative rounded-2xl border p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
                  plan.popular
                    ? "border-primary/50 bg-card glow-orange-border scale-[1.02]"
                    : "border-border bg-card/50"
                )}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Label Badge */}
                <div className="absolute -top-3 left-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                    plan.popular
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {plan.popular && <Zap className="h-3 w-3" />}
                    {plan.label}
                  </span>
                </div>

                {/* Plan Name */}
                <div className="mt-4 mb-6">
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plan.monthlyPrice?.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  
                  {/* Credits Allotment */}
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.monthlyCredits} Credits included
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-3">
                      {feature.isHeader ? (
                        <span className="text-sm text-muted-foreground font-medium">
                          {feature.text}
                        </span>
                      ) : (
                        <>
                          {feature.included ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              feature.grayed && "text-muted-foreground/50"
                            )}
                          >
                            {feature.text}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  size="lg"
                  variant={buttonConfig.variant}
                  disabled={buttonConfig.disabled || isLoading}
                  onClick={buttonConfig.action || undefined}
                >
                  {isLoading ? "Loading..." : buttonConfig.text}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Credit explainer */}
        <p className="text-sm text-muted-foreground/60 text-center mt-8 mb-16">
          50 monthly credits included with every plan. Unused credits carry forward — they never expire.
        </p>

        {/* Power Up Credits Purchase Section - Visible to everyone */}
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

      {/* Power Up Modal */}
      <PurchasePowerUpModal
        open={powerUpModalOpen}
        onOpenChange={setPowerUpModalOpen}
      />

      {/* Downgrade Warning Modal */}
      <DowngradeWarningModal
        open={downgradeModalOpen}
        onOpenChange={setDowngradeModalOpen}
        currentCredits={credits?.credits_remaining || 0}
        fromPlan={getCurrentPlanForModal()}
        toPlan={targetDowngradePlan}
        onConfirm={handleConfirmDowngrade}
      />

      {/* Upgrade Confirmation Modal */}
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
