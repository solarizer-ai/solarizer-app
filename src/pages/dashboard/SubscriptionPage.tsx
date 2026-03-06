import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { PurchaseCreditsModal } from "@/components/PurchaseCreditsModal";
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

  const { data: subscription, isLoading: subscriptionLoading, isExpired } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const {
    createSubscription,
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

  const plan = subscription?.plan || null;
  const isPro = plan === "pro";
  const isBusiness = plan === "business";
  const isPaid = isPro || isBusiness;
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  const hasPendingCancellation = subscription?.cancel_at_period_end === true;

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

      {/* Unified Plan Card */}
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
            onCancelSubscription={isPaid && !hasPendingCancellation ? () => setShowCancelModal(true) : undefined}
            renewalDate={subscription?.current_period_end || null}
            onReactivate={() => reactivateSubscription()}
            isReactivating={isReactivating}
            onRenew={(planId) => createSubscription({ plan: planId as "starter" | "pro" | "business", billingPeriod: "monthly" })}
            isExpired={isExpired}
          />
        </CardContent>
      </Card>

      {/* Credits — compact */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Credits</CardTitle>
              <CardDescription className="text-xs">{isPaid ? "Your credit balance" : "Your Spark plan credit balance"}</CardDescription>
            </div>
            {isPaid && (
              <Button size="sm" variant="outline" onClick={() => setShowPowerUpModal(true)} className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />Buy Credits
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPaid ? (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xl font-bold text-foreground">{creditsRemaining.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-xl font-bold text-foreground">{creditsUsed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Used</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xl font-bold text-foreground">{creditsRemaining.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")} className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />Upgrade for more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseCreditsModal open={showPowerUpModal} onOpenChange={setShowPowerUpModal} />
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
        onConfirm={async (couponCode?: string) => { setShowUpgradeModal(false); await upgradeSubscription({ toPlan: targetUpgradePlan, coupon_code: couponCode }); }}
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
