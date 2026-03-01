import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Zap,
  Search,
  FolderUp,
  BarChart3,
  FileDown,
  Radar,
  GitBranch,
  ShieldCheck,
  Bug,
  Wrench,
  Lightbulb,
  Share2,
  ListChecks,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { SubscribeConfirmationModal } from "@/components/SubscribeConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { formatPlanName } from "@/lib/planNames";

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

type PlanId = 'starter' | 'pro' | 'business';

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  monthlyCredits: number;
  creditRate: number;
  nlocLimit: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Spark',
    tagline: 'Essentials',
    monthlyPrice: 149,
    monthlyCredits: 50,
    creditRate: 4.0,
    nlocLimit: '500',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Blaze',
    tagline: 'Most Popular',
    monthlyPrice: 199,
    monthlyCredits: 50,
    creditRate: 3.7,
    nlocLimit: '3,000',
    popular: true,
  },
  {
    id: 'business',
    name: 'Inferno',
    tagline: 'Full Power',
    monthlyPrice: 499,
    monthlyCredits: 50,
    creditRate: 3.5,
    nlocLimit: '9,999',
    popular: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Feature card data                                                  */
/* ------------------------------------------------------------------ */

interface Feature {
  icon: typeof Search;
  title: string;
  description: string;
  plans: PlanId[];
}

const features: Feature[] = [
  {
    icon: Search,
    title: "Vulnerability Scan",
    description: "Single-pass hunter identifies critical, high, and medium severity issues.",
    plans: ['starter', 'pro', 'business'],
  },
  {
    icon: FolderUp,
    title: "Multi-File Upload",
    description: "Upload entire project folders or import from GitHub.",
    plans: ['starter', 'pro', 'business'],
  },
  {
    icon: BarChart3,
    title: "Dashboard Reports",
    description: "Save audit reports to your cloud dashboard for reference.",
    plans: ['starter', 'pro', 'business'],
  },
  {
    icon: FileDown,
    title: "Local Markdown Export",
    description: "Download complete audit reports as markdown files.",
    plans: ['starter', 'pro', 'business'],
  },
  {
    icon: Radar,
    title: "Deep Scan",
    description: "Second-pass analysis on L2+ contracts catches deeper vulnerabilities.",
    plans: ['pro', 'business'],
  },
  {
    icon: GitBranch,
    title: "Cross-Contract Analysis",
    description: "Detect vulnerabilities across contract interactions and dependencies.",
    plans: ['pro', 'business'],
  },
  {
    icon: ShieldCheck,
    title: "AI Validation",
    description: "AI-powered false positive elimination for higher accuracy.",
    plans: ['pro', 'business'],
  },
  {
    icon: Bug,
    title: "QA Scan",
    description: "Uncover Low, Info, and Gas optimization findings.",
    plans: ['pro', 'business'],
  },
  {
    icon: Wrench,
    title: "Remediation Guidance",
    description: "Actionable fix suggestions with code examples for each finding.",
    plans: ['pro', 'business'],
  },
  {
    icon: Lightbulb,
    title: "Architecture Insights",
    description: "Protocol design review, dependency graphs, and composability risk analysis.",
    plans: ['business'],
  },
  {
    icon: Share2,
    title: "Report Sharing",
    description: "Share reports with up to 5 team collaborators.",
    plans: ['business'],
  },
  {
    icon: ListChecks,
    title: "Remediation Tracking",
    description: "Track fix progress, comment on findings, and monitor resolution.",
    plans: ['business'],
  },
  {
    icon: Globe,
    title: "Public Reports",
    description: "Generate a public link for any audit report — share it with anyone.",
    plans: ['business'],
  },
];

const planDisplayName: Record<PlanId, string> = {
  starter: 'Spark',
  pro: 'Blaze',
  business: 'Inferno',
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<'pro' | 'business'>('pro');
  const [targetSubscribePlan, setTargetSubscribePlan] = useState<PlanId>('starter');

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
    isSchedulingDowngrade,
  } = useRazorpaySubscription();

  const planOrder: Record<PlanId, number> = { starter: 1, pro: 2, business: 3 };

  const getPlanPrice = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.monthlyPrice ?? 0;
  };

  const handleSubscribeClick = (planId: PlanId) => {
    setTargetSubscribePlan(planId);
    setSubscribeModalOpen(true);
  };

  const handleSubscribeConfirm = async (couponCode?: string, accessTokenCode?: string) => {
    setSubscribeModalOpen(false);
    await createSubscription({
      plan: targetSubscribePlan,
      billingPeriod: 'monthly',
      coupon_code: couponCode,
      access_token_code: accessTokenCode,
    });
  };

  const handleUpgrade = async (couponCode?: string) => {
    setUpgradeModalOpen(false);
    await upgradeSubscription({ toPlan: targetUpgradePlan, coupon_code: couponCode });
  };

  const getButtonConfig = (planId: PlanId) => {
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

    const currentOrder = planOrder[currentPlan as PlanId] || 0;
    const targetOrder = planOrder[planId] || 0;

    if (subscription?.pending_plan === planId) {
      return {
        text: "Downgrade Scheduled",
        variant: "outline" as const,
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
          variant: "outline" as const,
          action: null,
          disabled: true,
          showCancelBadge: true,
          cancelDate: subscription.current_period_end,
        };
      }
      return {
        text: "Current Plan",
        variant: "outline" as const,
        action: null,
        disabled: true,
      };
    }

    if (targetOrder > currentOrder) {
      return {
        text: "Upgrade",
        variant: "default" as const,
        action: () => {
          setTargetUpgradePlan(planId as 'pro' | 'business');
          setUpgradeModalOpen(true);
        },
        disabled: subscriptionActionLoading,
      };
    }

    return {
      text: "Switch at Renewal",
      variant: "outline" as const,
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
    const plan = plans.find(p => p.id === currentPlan);
    return plan?.creditRate || 5.5;
  };

  const getCurrentPlanForModal = (): PlanId => {
    return (subscription?.plan as PlanId) || 'starter';
  };

  const isLoading = authLoading || subscriptionLoading || creditsLoading || subscriptionActionLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4">
        {/* ── Hero ── */}
        <section className="pt-28 pb-12 md:pt-40 md:pb-14 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Security That{" "}
            <span className="text-gradient">Scales</span>
          </h1>
          <p
            className="text-lg text-muted-foreground/60 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            From solo devs to security teams. One engine, three intensities.
          </p>
        </section>

        {/* ── Billing note ── */}
        <p className="text-sm text-muted-foreground/50 text-center mb-10">
          Monthly billing&nbsp;&middot;&nbsp;Annual subscriptions coming soon
        </p>

        {/* ── Plan selector cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const buttonConfig = getButtonConfig(plan.id);
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative rounded-2xl border overflow-hidden flex flex-col cursor-pointer",
                  "bg-foreground/[0.02] transition-colors duration-200",
                  "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both",
                  isSelected
                    ? "border-primary/40 glow-orange-border"
                    : "border-border/10 hover:border-primary/20"
                )}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="p-6 flex flex-col flex-grow">
                  {/* Tagline */}
                  <p className="text-xs font-mono uppercase tracking-widest text-primary/60 mb-1">
                    {plan.tagline}
                  </p>

                  {/* Plan name + badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {plan.popular && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Zap className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black">${plan.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground/60">/month</span>
                  </div>

                  {/* Key stats row */}
                  <p className="text-xs text-muted-foreground/50 mb-6">
                    {plan.monthlyCredits} credits/mo&nbsp;&middot;&nbsp;Up to {plan.nlocLimit} nLOC&nbsp;&middot;&nbsp;${plan.creditRate.toFixed(2)}/credit
                  </p>

                  {/* Spacer */}
                  <div className="flex-grow" />

                  {/* CTA Button */}
                  <Button
                    className="w-full h-12"
                    size="lg"
                    variant={buttonConfig.variant}
                    disabled={buttonConfig.disabled || isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      buttonConfig.action?.();
                    }}
                  >
                    {isLoading ? "Loading..." : buttonConfig.text}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Credit explainer ── */}
        <p className="text-sm text-muted-foreground/50 text-center mt-8 mb-4">
          50 monthly credits included with every plan. Unused credits carry forward — they never expire. Maintain an active subscription to use them.
        </p>

        {/* ── Feature card grid ── */}
        <section className="py-12 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">What's included</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((feature) => {
              const isActive = feature.plans.includes(selectedPlan);
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className={cn(
                    "relative rounded-2xl border p-4 transition-all duration-300",
                    isActive
                      ? "border-primary/20 bg-foreground/[0.02]"
                      : "border-border/10 opacity-30"
                  )}
                >
                  {/* Lock hint for inactive features */}
                  {!isActive && (
                    <div className="absolute top-3 right-3">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground/60 mb-3 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Plan pills */}
                  <div className="flex flex-wrap gap-1">
                    {feature.plans.map((pid) => (
                      <span
                        key={pid}
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] rounded-full font-medium",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {planDisplayName[pid]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-2xl mx-auto py-12">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="q1" className="bg-foreground/[0.02] border border-border/10 rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                What is a credit?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/60">
                1 credit ≈ 1 nLOC (normalized line of code), modified by contract complexity.
                L1 contracts cost 0.8× credits, L2 cost 1×, and L3 cost 1.2×.
                Every plan includes 50 credits per month.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2" className="bg-foreground/[0.02] border border-border/10 rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Can I switch plans?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/60">
                Yes. Upgrades are immediate with prorated billing. Downgrades take effect
                at the end of your current billing period.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3" className="bg-foreground/[0.02] border border-border/10 rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Do credits expire?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/60">
                No. Unused credits carry forward indefinitely as long as you maintain an
                active subscription.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4" className="bg-foreground/[0.02] border border-border/10 rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                What happens if I run out of credits?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/60">
                Purchase additional credits at your plan's rate — Spark at $2.80, Blaze at $2.50,
                or Inferno at $2.20 per credit.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5" className="bg-foreground/[0.02] border border-border/10 rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                Is the nLOC limit per audit or a monthly total?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/60">
                Per audit. Each plan's nLOC limit (Spark: 500, Blaze: 3,000, Inferno: 9,999)
                applies to each individual audit run. You can run as many audits as your credits
                allow — the limit only constrains the scope of a single audit.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-center mt-6">
            <Link
              to="/docs/plans-and-costing"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Learn more about how credits work &rarr;
            </Link>
          </p>
        </section>

        {/* ── Need more credits? ── */}
        <div className="flex items-center justify-center gap-3 py-8">
          <span className="text-sm text-muted-foreground/50">Need more credits? Purchase at your plan rate.</span>
          <Button
            variant="link"
            className="text-primary px-0"
            onClick={() => {
              if (!user) {
                navigate('/login?redirect=/pricing');
                return;
              }
              if (!subscription) {
                toast({
                  title: "Subscription Required",
                  description: "Please subscribe to a plan before purchasing credits.",
                });
                return;
              }
              setPowerUpModalOpen(true);
            }}
          >
            Buy Credits
          </Button>
        </div>
      </main>

      <Footer />

      {/* ── Modals (untouched) ── */}
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

      <SubscribeConfirmationModal
        open={subscribeModalOpen}
        onOpenChange={setSubscribeModalOpen}
        plan={targetSubscribePlan}
        onConfirm={handleSubscribeConfirm}
        isLoading={subscriptionActionLoading}
      />
    </div>
  );
};

export default Pricing;
