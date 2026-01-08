import { useState } from "react";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    nLoc: "250",
    description: "Perfect for individual developers exploring smart contract security.",
    features: [
      { name: "Basic logic analysis", included: true },
      { name: "Pattern matching", included: true },
      { name: "Community access", included: true },
      { name: "High-priority AI reasoning", included: false },
      { name: "PDF security reports", included: false },
      { name: "Multi-file context analysis", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 49,
    annualPrice: 490,
    nLoc: "1,500",
    description: "For teams shipping production-grade protocols.",
    features: [
      { name: "Basic logic analysis", included: true },
      { name: "Pattern matching", included: true },
      { name: "Community access", included: true },
      { name: "High-priority AI reasoning", included: true },
      { name: "PDF security reports", included: true },
      { name: "10 full scans per month", included: true },
    ],
    cta: "Select Plan",
    popular: true,
  },
  {
    name: "Elite",
    monthlyPrice: 149,
    annualPrice: 1490,
    nLoc: "5,000",
    description: "Enterprise-grade security for complex DeFi systems.",
    features: [
      { name: "Everything in Professional", included: true },
      { name: "Multi-file context analysis", included: true },
      { name: "Flash-loan attack simulation", included: true },
      { name: "Priority support", included: true },
      { name: "Unlimited scans", included: true },
      { name: "Custom integrations", included: true },
    ],
    cta: "Select Plan",
    popular: false,
  },
];

const faqs = [
  {
    question: "What counts as nLOC?",
    answer:
      "Normalized Lines of Code (nLOC) measures the actual logic in your contract, excluding comments, blank lines, and formatting. This ensures fair, consistent pricing regardless of code style.",
  },
  {
    question: "Can I upgrade mid-billing cycle?",
    answer:
      "Yes! When you upgrade, we'll pro-rate the difference for the remainder of your billing period. You'll only pay the difference.",
  },
  {
    question: "How do top-ups work?",
    answer:
      "Top-up credits add additional nLOC capacity to your account. They're valid for 30 days from purchase and stack with your plan's base capacity.",
  },
  {
    question: "Is there a free trial for Professional?",
    answer:
      "Yes, we offer a 14-day free trial of Professional with full access to all features. No credit card required to start.",
  },
];


const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Choose Your Security Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Transparent pricing that scales with your protocol. No hidden fees.
            </p>

            {/* Monthly/Annual Toggle */}
            <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border">
              <button
                onClick={() => setIsAnnual(false)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  !isAnnual
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                  isAnnual
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success font-medium">
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative flex flex-col p-8 rounded-xl border border-zinc-800 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5",
                    plan.popular && "border-t-2 border-t-primary"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold font-mono">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">
                          ${plan.monthlyPrice * 12}
                        </span>
                        <span className="text-success ml-2">
                          Save ${plan.monthlyPrice * 12 - plan.annualPrice}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mb-6 pb-6 border-b border-zinc-800">
                    <p className="text-sm text-muted-foreground">
                      Up to{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {plan.nLoc}
                      </span>{" "}
                      nLOC per scan
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-start gap-3 text-sm"
                      >
                        {feature.included ? (
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            feature.included
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Protocol Power-Up Section */}
        <section className="pb-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl border border-dashed border-zinc-800 bg-card/30">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Protocol Power-Up</h3>
                  <p className="text-sm text-muted-foreground">
                    Need more capacity? Scale on demand.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-sm">
                  <span className="font-mono font-bold text-lg">$15</span>
                  <span className="text-muted-foreground"> per 500 nLOC</span>
                </p>
                <Button variant="outline" className="border-zinc-700">
                  Purchase Top-up
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-4 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-zinc-800 bg-card/30"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
