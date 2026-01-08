import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { name: "3 audits per month", included: true },
      { name: "Basic vulnerability detection", included: true },
      { name: "Email support", included: true },
      { name: "Community access", included: true },
      { name: "Advanced detection", included: false },
      { name: "PDF reports", included: false },
      { name: "Priority support", included: false },
      { name: "API access", included: false },
    ],
    cta: "Get Started",
    href: "/auth",
    popular: false,
  },
  {
    name: "Pro",
    description: "For professional developers",
    monthlyPrice: 29,
    annualPrice: 23,
    features: [
      { name: "Unlimited audits", included: true },
      { name: "Basic vulnerability detection", included: true },
      { name: "Email support", included: true },
      { name: "Community access", included: true },
      { name: "Advanced detection", included: true },
      { name: "PDF reports", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: false },
    ],
    cta: "Start Pro Trial",
    href: "/auth?plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      { name: "Unlimited audits", included: true },
      { name: "Basic vulnerability detection", included: true },
      { name: "Email support", included: true },
      { name: "Community access", included: true },
      { name: "Advanced detection", included: true },
      { name: "PDF reports", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: true },
    ],
    cta: "Contact Sales",
    href: "/auth?plan=enterprise",
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can change your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
  },
  {
    question: "What happens when I reach my audit limit?",
    answer: "On the Free plan, you'll need to wait until the next month or upgrade to Pro for unlimited audits.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "Yes! Pro comes with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and cryptocurrency payments for annual plans.",
  },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Choose the plan that fits your needs. All plans include our core security scanning features.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={cn("text-sm", !isAnnual ? "text-foreground" : "text-muted-foreground")}>
                Monthly
              </span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={cn("text-sm", isAnnual ? "text-foreground" : "text-muted-foreground")}>
                Annual
              </span>
              {isAnnual && (
                <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Save 20%
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8 flex flex-col",
                  plan.popular
                    ? "border-primary bg-card shadow-lg shadow-primary/10"
                    : "border-border bg-card/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {plan.monthlyPrice !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold">Custom</div>
                  )}
                  {isAnnual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed annually (${plan.annualPrice * 12}/year)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={cn(!feature.included && "text-muted-foreground")}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  <Link to={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-t border-border bg-card/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Have questions? We've got answers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-2">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
