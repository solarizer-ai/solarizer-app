import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: 'launch' | 'pro' | 'business';
  name: string;
  label: string;
  monthlyPrice: number;
  annualPrice: number | null;
  baseNloc: number;
  powerUpPrice: number;
  powerUpDiscount: string | null;
  features: { text: string; included: boolean; grayed?: boolean }[];
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
    baseNloc: 150,
    powerUpPrice: 7,
    powerUpDiscount: null,
    hasAnnualDiscount: false,
    popular: false,
    features: [
      { text: 'Critical, High, and Medium Findings', included: true },
      { text: 'Web Dashboard View Only', included: true },
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
    baseNloc: 100,
    powerUpPrice: 5,
    powerUpDiscount: '29% OFF',
    hasAnnualDiscount: true,
    popular: true,
    features: [
      { text: 'Everything in Launch, plus:', included: true },
      { text: 'Interactive Code Editor', included: true },
      { text: 'Finding Recommendations (Remediation)', included: true },
      { text: 'Export Report (PDF)', included: true },
      { text: 'QA Findings (Low, Info)', included: true },
      { text: 'Security Coverage Score', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    label: 'For Teams',
    monthlyPrice: 299,
    annualPrice: 2990,
    baseNloc: 150,
    powerUpPrice: 4,
    powerUpDiscount: '43% OFF',
    hasAnnualDiscount: true,
    popular: false,
    features: [
      { text: 'Everything in Pro, plus:', included: true },
      { text: 'Share reports in Dashboard', included: true },
      { text: 'Add Team Members', included: true },
      { text: 'Comment & Track Remediation Progress', included: true },
    ],
  },
];

const faqs = [
  {
    question: "What is NLOC?",
    answer:
      "Normalized Lines of Code (NLOC) measures the actual logic in your smart contract by excluding comments and blank lines. This ensures fair pricing based on code complexity.",
  },
  {
    question: "How does annual billing work?",
    answer:
      "When you choose annual billing for Pro or Business plans, you get 2 months free (pay for 10 months, get 12). Launch plan pricing remains fixed at $149/mo regardless of billing period.",
  },
  {
    question: "What happens when I exceed my NLOC limit?",
    answer:
      "If your scan exceeds your included NLOC, you can purchase Power-Ups to add more capacity instantly. Power-Up credits never expire and carry over between billing periods.",
  },
  {
    question: "Do unused NLOC credits roll over?",
    answer:
      "Yes! Your NLOC credits never expire. Whether you Upgrade, Downgrade, or buy Power-Ups, your balance is always maintained as long as you have an active subscription.",
  },
  {
    question: "Can I change my plan anytime?",
    answer:
      "Yes, you can upgrade or downgrade anytime. Your NLOC balance carries over, and you'll be prorated for any plan changes mid-billing cycle.",
  },
];

type SimulatedPlan = 'none' | 'launch' | 'pro' | 'business';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [simulatedPlan, setSimulatedPlan] = useState<SimulatedPlan>('none');

  const getButtonState = (planId: 'launch' | 'pro' | 'business') => {
    const planOrder = { none: -1, launch: 0, pro: 1, business: 2 };
    const currentOrder = planOrder[simulatedPlan];
    const targetOrder = planOrder[planId];

    if (simulatedPlan === 'none') {
      return { text: 'Get Started', variant: 'default' as const, disabled: false };
    }
    if (currentOrder === targetOrder) {
      return { text: 'Current Plan', variant: 'outline' as const, disabled: true };
    }
    if (targetOrder > currentOrder) {
      return { text: 'Upgrade', variant: 'default' as const, disabled: false };
    }
    return { text: 'Downgrade', variant: 'outline' as const, disabled: false };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Header Section with Dev Simulator */}
        <div className="relative text-center mb-12">
          {/* Dev Simulator Dropdown */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Simulate Current Plan</span>
            <Select value={simulatedPlan} onValueChange={(value) => setSimulatedPlan(value as SimulatedPlan)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Flexible Pricing for Smart Contract Security
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            Pay for what you analyze. Scale as you grow.
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
            const buttonState = getButtonState(plan.id);
            const showAnnualBadge = billingPeriod === 'annual' && plan.hasAnnualDiscount;
            const displayPrice = billingPeriod === 'monthly' || !plan.hasAnnualDiscount
              ? plan.monthlyPrice
              : plan.annualPrice;
            const priceLabel = billingPeriod === 'monthly' || !plan.hasAnnualDiscount
              ? '/mo'
              : '/yr';

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
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
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
                    {plan.baseNloc} NLOC included
                  </p>

                  {/* Power-Up Price */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-primary">
                      ${plan.powerUpPrice} / extra NLOC
                    </span>
                    {plan.powerUpDiscount && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        {plan.powerUpDiscount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-3">
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
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild={!buttonState.disabled}
                  className={cn(
                    "w-full",
                    buttonState.text === 'Upgrade' && "bg-primary hover:bg-primary/90"
                  )}
                  size="lg"
                  variant={buttonState.variant}
                  disabled={buttonState.disabled}
                >
                  {buttonState.disabled ? (
                    <span>{buttonState.text}</span>
                  ) : (
                    <Link to="/coming-soon">{buttonState.text}</Link>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* NLOC Guarantee Section */}
        <div 
          className="max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "600ms" }}
        >
          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-green-400" />
              <h3 className="text-2xl font-bold">The NLOC Guarantee</h3>
            </div>
            <p className="text-xl font-medium text-green-400 mb-3">
              Your Code Credits Never Expire.
            </p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you Upgrade, Downgrade, or buy Power Ups, your NLOC balance is 
              always maintained. Credits remain valid forever, requiring only an active 
              subscription (minimum Launch Plan) to utilize.
            </p>
          </div>
        </div>

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
    </div>
  );
};

export default Pricing;
