import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, ArrowUpRight, Receipt, ChevronLeft, ChevronRight, X, CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { formatPlanName } from "@/lib/planNames";
import { useBillingHistory, BillingEvent } from "@/hooks/useBillingHistory";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { CancelSubscriptionModal } from "@/components/CancelSubscriptionModal";
import { SubscriptionPlanSelector } from "@/components/settings/SubscriptionPlanSelector";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { DowngradeWarningModal } from "@/components/DowngradeWarningModal";
import { CreditActivityLog } from "@/components/settings/CreditActivityLog";

const DEFAULT_HISTORY_PAGE_SIZE = 10;

const BillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "activity" ? "activity" : "overview";

  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<"pro" | "business">("pro");
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<"starter" | "pro">("starter");

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE);
  const [historyStartDate, setHistoryStartDate] = useState<Date | undefined>(undefined);
  const [historyEndDate, setHistoryEndDate] = useState<Date | undefined>(undefined);

  const historyStartDateStr = historyStartDate ? format(historyStartDate, "yyyy-MM-dd") : null;
  const historyEndDateStr = historyEndDate ? format(historyEndDate, "yyyy-MM-dd") : null;

  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { events, isLoading: eventsLoading, totalCount } = useBillingHistory({
    startDate: historyStartDateStr,
    endDate: historyEndDateStr,
    page: historyPage,
    pageSize: historyPageSize,
  });
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

  const hasSubscription = !!subscription;
  const plan = subscription?.plan || null;
  const isPro = plan === "pro";
  const isBusiness = plan === "business";
  const isPaid = isPro || isBusiness;
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  const hasPendingCancellation = subscription?.cancel_at_period_end === true;
  const historyTotalPages = Math.max(1, Math.ceil(totalCount / historyPageSize));
  const hasHistoryFilters = historyStartDate || historyEndDate;

  // Credit balance calculations
  const totalCredits = creditsRemaining + creditsUsed;
  const remainingPercent = totalCredits > 0 ? (creditsRemaining / totalCredits) * 100 : 100;

  const progressColorClass =
    remainingPercent > 50
      ? "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-orange-400"
      : remainingPercent > 20
        ? "[&>div]:bg-warning"
        : "[&>div]:bg-destructive";

  const getPricePerCreditCents = () => {
    if (plan === "business") return 350;
    if (plan === "pro") return 370;
    return 400;
  };
  const pricePerCreditDollars = getPricePerCreditCents() / 100;

  const getPlanPrice = (planId: string) => {
    const prices: Record<string, number> = { starter: 149, pro: 199, business: 499 };
    return prices[planId] || 0;
  };

  const getProrationAmount = () => {
    const currentPrice = getPlanPrice(plan as string);
    const newPrice = getPlanPrice(targetUpgradePlan);
    return (newPrice - currentPrice) * 100;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  // Pagination info
  const historyFrom = (historyPage - 1) * historyPageSize + 1;
  const historyTo = Math.min(historyPage * historyPageSize, totalCount);

  const renderEvent = (event: BillingEvent) => {
    if (event.type === "power_up") {
      return (
        <div key={`power-up-${event.data.id}`} className="flex items-center justify-between p-4 border-b border-border last:border-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-medium text-foreground">Power-Up Purchase</p>
              <p className="text-sm text-muted-foreground">+{event.data.nloc_amount.toLocaleString()} nLOC credits</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-foreground">{formatCurrency(event.data.price_cents)}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy")}</p>
          </div>
        </div>
      );
    }
    if (event.type === "subscription_change") {
      return (
        <div key={`sub-change-${event.data.id}`} className="flex items-center justify-between p-4 border-b border-border last:border-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-accent/50"><ArrowUpRight className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <p className="font-medium text-foreground">Plan Change</p>
              <p className="text-sm text-muted-foreground">{formatPlanName(event.data.previous_plan)} → {formatPlanName(event.data.new_plan)}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={event.data.new_plan === "pro" ? "default" : "secondary"}>{formatPlanName(event.data.new_plan)}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{format(new Date(event.date), "MMM d, yyyy")}</p>
          </div>
        </div>
      );
    }
    return null;
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
      <PageHeader
        icon={Receipt}
        title="Billing"
        subtitle="Manage your plan, credits, and view transaction history"
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-card">
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-card">
            Credit Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Credit Balance Hero Card */}
          <Card className="overflow-hidden relative">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Credits</CardTitle>
                    <CardDescription className="text-xs">
                      {isPaid ? "Your credit balance" : "Spark plan balance"}
                    </CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowPowerUpModal(true)}
                  className="gap-1.5 hover:glow-orange-sm transition-all">
                  <Zap className="w-3.5 h-3.5" /> Buy Credits
                </Button>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-4">
              {/* Hero number */}
              <p className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-foreground tracking-tight">
                {creditsRemaining.toLocaleString()}
              </p>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <Progress
                  value={remainingPercent}
                  className={cn("h-2", progressColorClass)}
                />
                <p className="text-xs text-muted-foreground">
                  {Math.round(remainingPercent)}% remaining
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex sm:block items-center justify-between sm:justify-start
                                py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-border last:border-0">
                  <p className="text-xs text-muted-foreground font-medium">Remaining</p>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {creditsRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="flex sm:block items-center justify-between sm:justify-start
                                py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-border last:border-0 sm:pl-3">
                  <p className="text-xs text-muted-foreground font-medium">Used This Period</p>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {creditsUsed.toLocaleString()}
                  </p>
                </div>
                <div className="flex sm:block items-center justify-between sm:justify-start
                                py-2 sm:py-0 sm:pl-3">
                  <p className="text-xs text-muted-foreground font-medium">Rate</p>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    ${pricePerCreditDollars.toFixed(2)}<span className="text-xs text-muted-foreground">/ea</span>
                  </p>
                </div>
              </div>

              {/* Renewal info */}
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  50 credits included · Renews {format(new Date(subscription.current_period_end), "MMM d")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Plan Card */}
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
              />
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your power-up purchases and plan changes</CardDescription>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 w-full sm:w-[160px] justify-start text-left text-xs font-normal", !historyStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {historyStartDate ? format(historyStartDate, "dd-MM-yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={historyStartDate} onSelect={(d) => { setHistoryStartDate(d); setHistoryPage(1); }} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 w-full sm:w-[160px] justify-start text-left text-xs font-normal", !historyEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {historyEndDate ? format(historyEndDate, "dd-MM-yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={historyEndDate} onSelect={(d) => { setHistoryEndDate(d); setHistoryPage(1); }} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {hasHistoryFilters && (
                  <Button variant="ghost" size="sm" onClick={() => { setHistoryStartDate(undefined); setHistoryEndDate(undefined); setHistoryPage(1); }} className="h-8 px-2 text-xs gap-1">
                    <X className="w-3 h-3" /> Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No billing history yet</p>
                  <p className="text-sm text-muted-foreground/70">Your purchases and plan changes will appear here</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border">{events.map((event) => renderEvent(event))}</div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage <= 1}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage >= historyTotalPages}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Showing {historyFrom}–{historyTo} of {totalCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Rows</span>
                      <Select value={String(historyPageSize)} onValueChange={(v) => { setHistoryPageSize(Number(v)); setHistoryPage(1); }}>
                        <SelectTrigger className="h-8 w-[70px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <CreditActivityLog />
        </TabsContent>
      </Tabs>

      {/* Modals */}
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

export default BillingPage;
