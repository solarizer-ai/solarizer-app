import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

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
  baseNloc: number;
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
    baseNloc: 150,
    powerUpPrice: 7,
    hasAnnualDiscount: false,
    popular: false,
    features: [
      { text: 'Critical, High, and Medium Findings', included: true },
      { text: 'Web Dashboard View Only', included: true },
      { text: 'NLOC Power Ups available', included: true },
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
    hasAnnualDiscount: true,
    popular: true,
    features: [
      { text: 'Everything in Launch, plus:', included: true, isHeader: true },
      { text: 'Interactive Code Editor', included: true },
      { text: 'Finding Recommendations (Remediation)', included: true },
      { text: 'Export Report', included: true },
      { text: 'QA Findings (Low, Info)', included: true },
      { text: 'Security Coverage', included: true },
      { text: 'NLOC Power Ups at 29% Off', included: true },
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
    hasAnnualDiscount: true,
    popular: false,
    features: [
      { text: 'Everything in Pro, plus:', included: true, isHeader: true },
      { text: 'Share reports in Dashboard', included: true },
      { text: 'Add Team Members', included: true },
      { text: 'Comment & Track Remediation Progress', included: true },
      { text: 'NLOC Power Ups at 43% Off', included: true },
    ],
  },
];

const faqs = [
  {
    question: "What exactly counts towards my NLOC limit?",
    answer:
      "Every line of code in the files you upload is scanned and counted towards your quota. This includes imports and external libraries if they are present in the file. Tip: To save NLOC, we recommend flattening your contracts or only uploading your core logic files.",
  },
  {
    question: "What happens to my NLOC if I switch plans?",
    answer:
      "Your NLOC balance is yours. If you Upgrade or Downgrade your plan, your existing NLOC balance (from subscriptions or Power Ups) is maintained and rolls over to the new plan. You never lose the capacity you paid for.",
  },
  {
    question: "Do my NLOC credits expire?",
    answer:
      "No. Any NLOC capacity you buy never expires as long as you maintain an active subscription (minimum Launch Plan). Unused credits simply roll over to the next month.",
  },
  {
    question: "Can I buy Power Ups without a subscription?",
    answer:
      "No. You need an active subscription (Launch, Pro, or Business) to access the Solarizer analysis engine. However, you can buy as many Power Ups as you need on top of any active plan.",
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
];

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [customNloc, setCustomNloc] = useState<Record<string, number>>({
    launch: 150,
    pro: 100,
    business: 150
  });

  const calculateEstimate = (plan: PricingPlan) => {
    const planNloc = customNloc[plan.id];
    const extraNloc = Math.max(0, planNloc - plan.baseNloc);
    const extraCost = extraNloc * plan.powerUpPrice;
    const basePrice = billingPeriod === 'monthly' || !plan.hasAnnualDiscount 
      ? plan.monthlyPrice 
      : plan.annualPrice!;
    
    return {
      included: plan.baseNloc,
      extra: extraNloc,
      extraCost,
      basePrice,
      total: basePrice + extraCost,
      powerUpPrice: plan.powerUpPrice
    };
  };

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
            const estimate = calculateEstimate(plan);

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

                {/* NLOC Calculator */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium mb-3">Estimate Your Cost</p>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm text-muted-foreground">Custom NLOC:</label>
                    <Input
                      type="number"
                      value={customNloc[plan.id]}
                      onChange={(e) => setCustomNloc(prev => ({
                        ...prev,
                        [plan.id]: Math.max(1, parseInt(e.target.value) || 0)
                      }))}
                      className="w-24 h-8 text-sm"
                      min={1}
                    />
                  </div>
                  
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Included: {estimate.included} NLOC</p>
                    {estimate.extra > 0 && (
                      <p>Extra: {estimate.extra} NLOC × ${estimate.powerUpPrice} = ${estimate.extraCost.toLocaleString()}</p>
                    )}
                    <div className="border-t border-border pt-1 mt-2">
                      <p className="text-foreground font-medium">
                        Total: ${estimate.basePrice.toLocaleString()}
                        {estimate.extra > 0 && ` + $${estimate.extraCost.toLocaleString()} = $${estimate.total.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground/70 mt-2 italic">
                    Power Ups purchased from dashboard after subscribing
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to="/coming-soon">Get Started</Link>
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
