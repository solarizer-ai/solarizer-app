import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { useToast } from "@/hooks/use-toast";

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
  baseCredits: number;
  powerUpPrice: number;
  features: PricingFeature[];
  popular: boolean;
  hasAnnualDiscount: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'launch',
    name: 'Launch',
    label: 'Trial / Starter',
    monthlyPrice: 149,
    annualPrice: null,
    baseCredits: 150,
    powerUpPrice: 7,
    hasAnnualDiscount: false,
    popular: false,
    features: [
      { text: 'Critical, High, and Medium Findings', included: true },
      { text: 'Web Dashboard View Only', included: true },
      { text: 'Power up Credits available', included: true },
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
    baseCredits: 150,
    powerUpPrice: 6,
    hasAnnualDiscount: true,
    popular: true,
    features: [
      { text: 'Everything in Launch, plus:', included: true, isHeader: true },
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
    baseCredits: 150,
    powerUpPrice: 5,
    hasAnnualDiscount: true,
    popular: false,
    features: [
      { text: 'Everything in Pro, plus:', included: true, isHeader: true },
      { text: 'Share reports in Dashboard', included: true },
      { text: 'Add Team Members', included: true },
      { text: 'Comment & Track Remediation Progress', included: true },
      { text: 'Power up Credits at 29% Off', included: true },
    ],
  },
];

const faqs = [
  {
    question: "What is a Power up Credit?",
    answer:
      "Simple: 1 Power up Credit allows you to audit exactly 1 line of Solidity code. It's the fuel for your smart contract's security.",
  },
  {
    question: "What exactly counts towards my Power up Credit limit?",
    answer:
      "Every line of code in the files you upload is scanned and counted towards your quota. This includes imports and external libraries if they are present in the file. Tip: To save credits, we recommend flattening your contracts or only uploading your core logic files.",
  },
  {
    question: "What happens to my credits if I switch plans?",
    answer:
      "Your credit balance is yours. If you Upgrade or Downgrade your plan, your existing balance (from subscriptions or Power ups) is maintained and rolls over to the new plan. You never lose the capacity you paid for.",
  },
  {
    question: "Do my Power up Credits expire?",
    answer:
      "No. Any credits you buy never expire as long as you maintain an active subscription (minimum Launch Plan). Unused credits simply roll over to the next month.",
  },
  {
    question: "Can I buy Power ups without a subscription?",
    answer:
      "No. You need an active subscription (Launch, Pro, or Business) to access the Solarizer analysis engine. However, you can buy as many Power ups as you need on top of any active plan.",
  },
  {
    question: "Why can't I see remediation recommendations on the Launch Plan?",
    answer:
      "The Launch Plan is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation, the interactive code editor, and PDF reporting, you will need to upgrade to the Pro Plan.",
  },
  {
    question: "How does the Annual Discount work?",
    answer:
      "If you choose Annual billing for the Pro or Business plans, you pay for 10 months and get 2 months free. The Launch Plan does not offer an annual discount.",
  },
  {
    question: "What is Security Coverage and how is it different from \"Findings\"?",
    answer:
      "\"Findings\" only show you what is broken. Security Coverage shows you everything we checked to ensure it was safe. It is a complete ledger of all security hypotheses—such as \"Does this contract have reentrancy protection?\"—and their results.",
  },
  {
    question: "Why is this important for me?",
    answer:
      "It provides transparency and trust. Instead of wondering if an auditor simply missed a bug, you can see a line-by-line verification that specific risks (like Integer Overflows or Access Control failures) were tested and passed.",
  },
  {
    question: "What does a \"PASSED\" test mean in the coverage?",
    answer:
      "A \"PASSED\" status means the engine specifically analyzed that vector and found the contract to be secure against it. For these tests, we provide Proof—a brief explanation of why that specific logic is safe (e.g., \"Uses OpenZeppelin's ReentrancyGuard\").",
  },
  {
    question: "What happens when a test \"FAILS\"?",
    answer:
      "If a test fails, it is automatically linked to a detailed Finding. You can click the \"View Issue\" button next to any failed test to see the exact line of code, the severity of the risk, and the recommended fix.",
  },
];

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();

  const planOrder = { launch: 1, starter: 1, pro: 2, business: 3 };

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
        action: () => {
          toast({
            title: "Coming Soon",
            description: "Subscription checkout will be available shortly.",
          });
        },
        disabled: false,
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
        action: () => {
          toast({
            title: "Coming Soon",
            description: "Plan upgrades will be available shortly.",
          });
        },
        disabled: false,
      };
    }

    // Downgrade
    return {
      text: "Downgrade",
      variant: "outline" as "outline",
      action: () => {
        toast({
          title: "Coming Soon",
          description: "Plan changes will be available shortly.",
        });
      },
      disabled: false,
    };
  };

  const getDiscountedPrice = () => {
    const currentPlan = subscription?.plan || 'launch';
    const normalizedPlan = currentPlan === 'starter' ? 'launch' : currentPlan;
    const plan = pricingPlans.find(p => p.id === normalizedPlan);
    return plan?.powerUpPrice || 7;
  };

  const isLoading = authLoading || subscriptionLoading;

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
                  
                  {/* Base Allotment */}
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.baseCredits} Power up Credits included
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

        {/* Power Up Credits Purchase Section - Only for logged-in subscribers */}
        {user && subscription && (
          <div
            className="max-w-lg mx-auto mb-16 p-6 rounded-2xl border border-primary/30 bg-card/50 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "600ms" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Need More Credits?</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Purchase additional Power up Credits at ${getDiscountedPrice()}/credit based on your current plan.
            </p>
            <Button
              variant="solarGlow"
              className="w-full"
              onClick={() => setPowerUpModalOpen(true)}
            >
              Purchase Power up Credits
            </Button>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-border pb-6 last:border-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-medium mb-2">{faq.question}</h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Power Up Modal */}
      <PurchasePowerUpModal
        open={powerUpModalOpen}
        onOpenChange={setPowerUpModalOpen}
      />
    </div>
  );
};

export default Pricing;
