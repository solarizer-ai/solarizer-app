import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { DowngradeWarningModal } from "@/components/DowngradeWarningModal";
import { useToast } from "@/hooks/use-toast";
import { PLAN_CREDIT_RATES } from "@/lib/nlocCalculator";
import { useCashfreeCheckout } from "@/hooks/useCashfreeCheckout";

interface PricingFeature {
  text: string;
  included: boolean;
  grayed?: boolean;
  isHeader?: boolean;
}

interface PricingPlan {
  id: 'launch' | 'pro' | 'business';
  name: string;
  label: string;
  monthlyPrice: number;
  annualPrice: number | null;
  monthlyCredits: number;
  annualCredits: number;
  powerUpPrice: number;
  features: PricingFeature[];
  popular: boolean;
  hasAnnualDiscount: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'launch',
    name: 'Launch',
    label: 'Free Trial',
    monthlyPrice: 149,
    annualPrice: null,
    monthlyCredits: 50,
    annualCredits: 50,
    powerUpPrice: 7,
    hasAnnualDiscount: false,
    popular: false,
    features: [
      { text: 'Critical, High, and Medium Findings', included: true },
      { text: 'Web Dashboard View Only', included: true },
      { text: 'Power up Credits available', included: true },
      { text: 'No GitHub Import', included: false, grayed: true },
      { text: 'No Remediation', included: false, grayed: true },
      { text: 'No Export', included: false, grayed: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    label: 'Most Popular',
    monthlyPrice: 199,
    annualPrice: 1990,
    monthlyCredits: 50,
    annualCredits: 500,
    powerUpPrice: 6,
    hasAnnualDiscount: true,
    popular: true,
    features: [
      { text: 'Everything in Launch, plus:', included: true, isHeader: true },
      { text: 'GitHub Import', included: true },
      { text: 'Interactive Code Editor', included: true },
      { text: 'Finding Recommendations (Remediation)', included: true },
      { text: 'Export Report', included: true },
      { text: 'QA Findings (Low, Info)', included: true },
      { text: 'Security Coverage', included: true },
      { text: 'Power up Credits at 14% Off', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    label: 'For Teams',
    monthlyPrice: 499,
    annualPrice: 4990,
    monthlyCredits: 50,
    annualCredits: 500,
    powerUpPrice: 5,
    hasAnnualDiscount: true,
    popular: false,
    features: [
      { text: 'Everything in Pro, plus:', included: true, isHeader: true },
      { text: 'Share reports in Dashboard', included: true },
      { text: 'Invite up to 5 Collaborators', included: true },
      { text: 'Comment & Track Remediation Progress', included: true },
      { text: 'Power up Credits at 29% Off', included: true },
    ],
  },
];

// FAQ moved to Docs page

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<'launch' | 'pro' | 'business'>('launch');
  
  const { user, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initiateCheckout, isLoading: checkoutLoading } = useCashfreeCheckout();

  const planOrder = { launch: 1, starter: 1, pro: 2, business: 3 };

  const handleSubscribe = async (planId: 'launch' | 'pro' | 'business') => {
    await initiateCheckout({
      orderType: 'subscription',
      plan: planId,
      billingPeriod: billingPeriod,
    });
  };

  const getButtonConfig = (planId: 'launch' | 'pro' | 'business') => {
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
        action: () => handleSubscribe(planId),
        disabled: checkoutLoading,
      };
    }

    // Normalize plan names (starter = launch)
    const normalizedCurrent = currentPlan === 'starter' ? 'launch' : currentPlan;
    const currentOrder = planOrder[normalizedCurrent] || 0;
    const targetOrder = planOrder[planId] || 0;

    // Same plan
    if (normalizedCurrent === planId || (currentPlan === 'starter' && planId === 'launch')) {
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
        action: () => handleSubscribe(planId),
        disabled: checkoutLoading,
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
      disabled: false,
    };
  };

  const handleConfirmDowngrade = async () => {
    setDowngradeModalOpen(false);
    await initiateCheckout({
      orderType: 'subscription',
      plan: targetDowngradePlan,
      billingPeriod: billingPeriod,
    });
  };

  const getDiscountedPrice = () => {
    const currentPlan = subscription?.plan || 'launch';
    const normalizedPlan = currentPlan === 'starter' ? 'launch' : currentPlan;
    const plan = pricingPlans.find(p => p.id === normalizedPlan);
    return plan?.powerUpPrice || 7;
  };

  const getCurrentPlanForModal = (): 'launch' | 'pro' | 'business' => {
    const plan = subscription?.plan || 'starter';
    return plan === 'starter' ? 'launch' : plan as 'launch' | 'pro' | 'business';
  };

  const isLoading = authLoading || subscriptionLoading || creditsLoading || checkoutLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Flexible Audit Pricing
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            Credits never expire. Upgrade, downgrade, or pause without losing value.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12 animate-in fade-in duration-500" style={{ animationDelay: "200ms" }}>
          <span className={cn(
            "font-medium transition-colors",
            billingPeriod === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
          )}>Monthly</span>
          
          <Switch
            checked={billingPeriod === 'annual'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'annual' : 'monthly')}
            className="data-[state=checked]:bg-primary"
          />
          
          <span className={cn(
            "font-medium transition-colors",
            billingPeriod === 'annual' ? 'text-foreground' : 'text-muted-foreground'
          )}>Annual</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {pricingPlans.map((plan, index) => {
            const showAnnualBadge = billingPeriod === 'annual' && plan.hasAnnualDiscount;
            const displayPrice = billingPeriod === 'monthly' || !plan.hasAnnualDiscount
              ? plan.monthlyPrice
              : plan.annualPrice;
            const priceLabel = billingPeriod === 'monthly' || !plan.hasAnnualDiscount
              ? '/mo'
              : '/yr';
            const buttonConfig = getButtonConfig(plan.id);

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border p-6 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
                  plan.popular
                    ? "border-primary/50 bg-card shadow-lg shadow-primary/20 scale-[1.02]"
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

                {/* 2 Months Free Badge */}
                {showAnnualBadge && (
                  <div className="absolute -top-3 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-background text-primary border border-primary/50">
                      2 Months Free
                    </span>
                  </div>
                )}

                {/* Plan Name */}
                <div className="mt-4 mb-6">
                  <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${displayPrice?.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">{priceLabel}</span>
                  </div>
                  
                  {/* Credits Allotment - Dynamic based on billing period */}
                  <p className="text-sm text-muted-foreground mt-2">
                    {billingPeriod === 'annual' && plan.hasAnnualDiscount
                      ? `${plan.annualCredits} Credits included`
                      : `${plan.monthlyCredits} Credits included`}
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
              ? `Purchase additional Power up Credits at $${getDiscountedPrice()}/credit based on your current plan.`
              : `Purchase additional Power up Credits starting at $5/credit with a subscription.`
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
    </div>
  );
};

export default Pricing;
