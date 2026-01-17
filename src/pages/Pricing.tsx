import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { POWER_UP_OPTIONS, PLAN_LIMITS } from "@/lib/nlocCalculator";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  usage: string;
  capacity: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: 0,
    usage: "2 scans total",
    capacity: `${PLAN_LIMITS.starter.nlocPerScan} nLOC per scan • Single file`,
    description: "Try Solarizer risk-free. No credit card required.",
    features: [
      { text: "Core logic analysis", included: true },
      { text: "Proprietary pattern matching", included: true },
      { text: "Single file per scan only", included: true },
      { text: "Multi-file analysis", included: false },
      { text: "Integrated Code Editor", included: false },
      { text: "Power-Ups available", included: true },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: 99,
    usage: "Unlimited scans",
    capacity: `${PLAN_LIMITS.pro.monthlyNloc.toLocaleString()} nLOC monthly`,
    description: "Full-featured security for production protocols.",
    features: [
      { text: "Core logic analysis", included: true },
      { text: "Proprietary pattern matching", included: true },
      { text: "Multi-file analysis", included: true },
      { text: "Integrated Code Editor", included: true },
      { text: "20% Power-Up discount", included: true },
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

const faqs = [
  {
    question: "What is nLOC?",
    answer:
      "Normalized Lines of Code (nLOC) measures the actual logic in your smart contract by excluding comments and blank lines. This ensures fair pricing based on code complexity.",
  },
  {
    question: "How does the Starter trial work?",
    answer:
      `Starter gives you 2 free scans, each with a maximum of ${PLAN_LIMITS.starter.nlocPerScan} nLOC and limited to a single file. No credit card required. It's perfect for testing Solarizer on a small contract.`,
  },
  {
    question: "What happens when I exceed my Pro limit?",
    answer:
      "If your scan exceeds your remaining monthly nLOC, you can purchase a Power-Up to add more capacity instantly. Unused credits from your monthly allowance reset every 30 days.",
  },
  {
    question: "Do unused nLOC credits roll over?",
    answer:
      "Monthly credits reset every 30 days. However, Power-Up credits never expire and are used only after your monthly allowance is depleted.",
  },
  {
    question: "Can I cancel my Pro subscription?",
    answer:
      "Yes, you can cancel anytime. You'll retain access until the end of your billing period, and any remaining Power-Up credits stay on your account.",
  },
];

const Pricing = () => {
  const [selectedPowerUp, setSelectedPowerUp] = useState<string>(
    POWER_UP_OPTIONS[0].nloc.toString()
  );

  const selected = POWER_UP_OPTIONS.find(
    (opt) => opt.nloc.toString() === selectedPowerUp
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Simple, Transparent Pricing
          </h1>
          <p
            className="text-lg text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-8 flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
                plan.popular
                  ? "border-primary/50 bg-card shadow-lg shadow-primary/20"
                  : "border-border bg-card/50"
              )}
              style={{ animationDelay: `${200 + index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">{plan.usage}</p>
                  <p className="text-sm font-medium text-primary">{plan.capacity}</p>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        !feature.included && "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="w-full"
                size="lg"
                variant={plan.popular ? "default" : "outline"}
              >
                <Link to="/coming-soon">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Power-Up Section */}
        <div
          className="max-w-3xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "500ms" }}
        >
          <div className="rounded-2xl border border-border bg-card/50 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Need more capacity?</h3>
                <p className="text-sm text-muted-foreground">
                  nLOC Power-Ups — Available to all users
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-6">
              Perfect for large protocol audits without upgrading your base plan. 
              Power-Ups are available to all users. Pro subscribers enjoy a 20% discount on all Power-Up purchases.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-grow w-full sm:w-auto">
                <label className="text-sm font-medium mb-2 block">Select Power-Up</label>
                <Select value={selectedPowerUp} onValueChange={setSelectedPowerUp}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {POWER_UP_OPTIONS.map((option) => (
                      <SelectItem key={option.nloc} value={option.nloc.toString()}>
                        <div className="flex items-center justify-between gap-8">
                          <span>{option.nloc.toLocaleString()} nLOC</span>
                          <span className="text-muted-foreground">
                            ${(option.priceCents / 100).toFixed(0)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="flex items-center gap-4">
                  {selected.savings > 0 && (
                    <span className="text-sm text-primary font-medium">
                      Save ${selected.savings} (~{selected.discountPercent}%)
                    </span>
                  )}
                  <Button>Purchase Power-Up</Button>
                </div>
              )}
            </div>
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
