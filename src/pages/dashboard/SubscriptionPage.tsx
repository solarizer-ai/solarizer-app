import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Calendar, ArrowUpRight, CreditCard, Clock, XCircle } from "lucide-react";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";
import { format } from "date-fns";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { CancelSubscriptionModal } from "@/components/CancelSubscriptionModal";
import { SubscriptionPlanSelector } from "@/components/settings/SubscriptionPlanSelector";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { DowngradeWarningModal } from "@/components/DowngradeWarningModal";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<"pro" | "business">("pro");
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<"starter" | "pro">("starter");

  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const {
    cancelSubscription,
    reactivateSubscription,
    cancelPendingDowngrade,
    upgradeSubscription,
    scheduleDowngrade,
    isLoading: subscriptionActionLoading,
    isReactivating,
    isCancellingDowngrade,
    isSchedulingDowngrade,
  } = useRazorpaySubscription();

  const hasSubscription = !!subscription;
  const plan = subscription?.plan || null;
  const isPro = plan === "pro";
  const isBusiness = plan === "business";
  const isPaid = isPro || isBusiness;
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  const hasPendingDowngrade = subscription?.pending_plan !== null && subscription?.pending_plan !== undefined;
  const hasPendingCancellation = subscription?.cancel_at_period_end === true;

  const getPlanDisplayName = () => {
    if (!hasSubscription) return "No Plan";
    if (subscription?.pending_plan) {
      const pendingName = subscription.pending_plan === "business" ? "Business" : subscription.pending_plan === "pro" ? "Pro" : "Launch";
      return `${plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Launch"} → ${pendingName}`;
    }
    if (plan === "business") return "Business";
    if (plan === "pro") return "Pro";
    return "Launch";
  };

  const getPlanDescription = () => {
    if (!hasSubscription) return "Subscribe to a plan to start using the platform";
    if (hasPendingCancellation && subscription?.current_period_end)
      return `Access until ${format(new Date(subscription.current_period_end), "MMM d, yyyy")}`;
    if (hasPendingDowngrade && subscription?.pending_plan_effective_date)
      return `Changes on ${format(new Date(subscription.pending_plan_effective_date), "MMM d, yyyy")}`;
    if (plan === "business") return "Unlimited scans, 150 base credits, team collaboration";
    if (plan === "pro") return "Unlimited scans with 150 credits monthly allowance";
    return `${PLAN_LIMITS.starter.nlocPerScan} nLOC per scan limit, 1 file per scan`;
  };

  const getPlanPrice = (planId: string) => {
    const prices: Record<string, number> = { starter: 149, pro: 199, business: 499 };
    return prices[planId] || 0;
  };

  const getProrationAmount = () => {
    const currentPrice = getPlanPrice(plan as string);
    const newPrice = getPlanPrice(targetUpgradePlan);
    return (newPrice - currentPrice) * 100;
  };

  if (subscriptionLoading || creditsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan and credits</p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant={isPaid ? "default" : "secondary"}>{getPlanDisplayName()}</Badge>
              </CardTitle>
              <CardDescription>{getPlanDescription()}</CardDescription>
            </div>
            {isPaid && subscription?.current_period_end && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Renews on</p>
                <p className="text-sm font-medium">{format(new Date(subscription.current_period_end), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPendingCancellation && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Cancellation Scheduled</p>
                <p className="text-xs text-muted-foreground">
                  Your subscription ends on {subscription?.current_period_end && format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => reactivateSubscription()} disabled={isReactivating}>
                {isReactivating ? "..." : "Reactivate"}
              </Button>
            </div>
          )}

          {hasPendingDowngrade && !hasPendingCancellation && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Downgrade Scheduled</p>
                <p className="text-xs text-muted-foreground">
                  Changes to {subscription?.pending_plan} on {subscription?.pending_plan_effective_date && format(new Date(subscription.pending_plan_effective_date), "MMM d, yyyy")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => cancelPendingDowngrade()} disabled={isCancellingDowngrade}>
                {isCancellingDowngrade ? "..." : "Cancel"}
              </Button>
            </div>
          )}

          {!hasSubscription && (
            <Button onClick={() => navigate("/pricing")} className="gap-2">
              <Zap className="w-4 h-4" />Subscribe to a Plan<ArrowUpRight className="w-4 h-4" />
            </Button>
          )}

          {hasSubscription && !isPaid && (
            <Button onClick={() => navigate("/pricing")} className="gap-2">
              <Zap className="w-4 h-4" />Upgrade to Pro<ArrowUpRight className="w-4 h-4" />
            </Button>
          )}

          {isPaid && !hasPendingCancellation && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {isPro ? "$199" : "$499"}/month
                  {subscription?.current_period_end && <> • Next billing: {format(new Date(subscription.current_period_end), "MMM d, yyyy")}</>}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowCancelModal(true)}
                disabled={subscriptionActionLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Selector */}
      <Card>
        <CardContent className="pt-6">
          <SubscriptionPlanSelector
            currentPlan={subscription?.plan || null}
            pendingPlan={subscription?.pending_plan || null}
            pendingPlanDate={subscription?.pending_plan_effective_date || null}
            hasPendingCancellation={hasPendingCancellation}
            onUpgrade={(p) => { setTargetUpgradePlan(p); setShowUpgradeModal(true); }}
            onDowngrade={(p) => { setTargetDowngradePlan(p); setShowDowngradeModal(true); }}
            onSubscribe={() => navigate("/pricing")}
            onCancelPendingDowngrade={() => cancelPendingDowngrade()}
            isLoading={subscriptionActionLoading || isSchedulingDowngrade}
            isCancellingDowngrade={isCancellingDowngrade}
          />
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle>{isPaid ? "Power-Up Credits" : "Credit Balance"}</CardTitle>
          <CardDescription>{isPaid ? "Your credit balance and usage this billing cycle" : "Your Launch plan credit balance"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPaid ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                  <p className="text-3xl font-bold text-foreground">{creditsRemaining.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Credits Left</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                  <p className="text-3xl font-bold text-foreground">{creditsUsed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Used This Cycle</p>
                </div>
              </div>
              {credits?.period_reset_at && (
                <p className="text-xs text-muted-foreground">Cycle resets on {format(new Date(credits.period_reset_at), "MMM d, yyyy")}</p>
              )}
              <Button onClick={() => setShowPowerUpModal(true)} className="w-full gap-2">
                <Zap className="w-4 h-4" />Purchase More Credits
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-3xl font-bold text-foreground">{creditsRemaining.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Credits Remaining</p>
              </div>
              <p className="text-xs text-muted-foreground">Each scan uses up to {PLAN_LIMITS.starter.nlocPerScan} credits (1 file max)</p>
              <Button onClick={() => navigate("/pricing")} className="w-full gap-2">
                <Zap className="w-4 h-4" />Upgrade to Pro for larger projects
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <PurchasePowerUpModal open={showPowerUpModal} onOpenChange={setShowPowerUpModal} />
      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        accessUntil={subscription?.current_period_end ? new Date(subscription.current_period_end) : null}
        currentPlan={subscription?.plan || "starter"}
        onConfirm={async () => { setShowCancelModal(false); await cancelSubscription(); }}
        isLoading={subscriptionActionLoading}
      />
      <UpgradeConfirmationModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        fromPlan={plan}
        toPlan={targetUpgradePlan}
        prorationAmount={getProrationAmount()}
        onConfirm={async () => { setShowUpgradeModal(false); await upgradeSubscription({ toPlan: targetUpgradePlan }); }}
        isLoading={subscriptionActionLoading}
      />
      <DowngradeWarningModal
        open={showDowngradeModal}
        onOpenChange={setShowDowngradeModal}
        currentCredits={creditsRemaining}
        fromPlan={plan as "starter" | "pro" | "business"}
        toPlan={targetDowngradePlan}
        onConfirm={() => { setShowDowngradeModal(false); scheduleDowngrade(targetDowngradePlan); }}
      />
    </div>
  );
};

export default SubscriptionPage;
