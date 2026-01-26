import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Loader2, Check, CreditCard, Zap, Calendar, ArrowUpRight, Users, Lock, Link2, LogOut, AlertCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useCashfreeSubscription } from "@/hooks/useCashfreeSubscription";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";
import { format } from "date-fns";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { CancelSubscriptionModal } from "@/components/CancelSubscriptionModal";
import { GitHubIntegration } from "@/components/settings/GitHubIntegration";
import { SubscriptionPlanSelector } from "@/components/settings/SubscriptionPlanSelector";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { DowngradeWarningModal } from "@/components/DowngradeWarningModal";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<"pro" | "business">("pro");
  const [targetDowngradePlan, setTargetDowngradePlan] = useState<"launch" | "pro">("launch");

  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { canShareReports } = useFeatureAccess();
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
  } = useCashfreeSubscription();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('display_name, email, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          display_name: displayName,
          email: user.email 
        }, { 
          onConflict: 'user_id' 
        });
      
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, display_name: displayName } : null);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const plan = subscription?.plan || 'starter';
  const isPro = plan === 'pro';
  const isBusiness = plan === 'business';
  const isPaid = isPro || isBusiness;
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  
  // New subscription status flags
  const hasPendingDowngrade = subscription?.pending_plan !== null && subscription?.pending_plan !== undefined;
  const hasPendingCancellation = subscription?.cancel_at_period_end === true;
  const hasPaymentMethod = subscription?.payment_method_saved === true;

  const getPlanDisplayName = () => {
    if (subscription?.pending_plan) {
      const pendingName = subscription.pending_plan === 'business' ? 'Business' : 
                          subscription.pending_plan === 'pro' ? 'Pro' : 'Launch';
      return `${plan === 'business' ? 'Business' : plan === 'pro' ? 'Pro' : 'Launch'} → ${pendingName}`;
    }
    if (plan === 'business') return 'Business';
    if (plan === 'pro') return 'Pro';
    return 'Launch';
  };

  const getPlanDescription = () => {
    if (hasPendingCancellation && subscription?.current_period_end) {
      return `Access until ${format(new Date(subscription.current_period_end), "MMM d, yyyy")}`;
    }
    if (hasPendingDowngrade && subscription?.pending_plan_effective_date) {
      return `Changes on ${format(new Date(subscription.pending_plan_effective_date), "MMM d, yyyy")}`;
    }
    if (plan === 'business') return 'Unlimited scans, 150 base credits, team collaboration';
    if (plan === 'pro') return 'Unlimited scans with 150 credits monthly allowance';
    return `${PLAN_LIMITS.starter.nlocPerScan} nLOC per scan limit, 1 file per scan`;
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    await cancelSubscription();
  };

  // Plan pricing for proration calculation
  const getPlanPrice = (planId: string) => {
    const prices: Record<string, number> = { launch: 149, starter: 149, pro: 199, business: 499 };
    return prices[planId] || 0;
  };

  const getProrationAmount = () => {
    const currentPrice = getPlanPrice(plan);
    const newPrice = getPlanPrice(targetUpgradePlan);
    return (newPrice - currentPrice) * 100; // cents
  };

  const handleUpgradeClick = (toPlan: "pro" | "business") => {
    setTargetUpgradePlan(toPlan);
    setShowUpgradeModal(true);
  };

  const handleDowngradeClick = (toPlan: "launch" | "pro") => {
    setTargetDowngradePlan(toPlan);
    setShowDowngradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    setShowUpgradeModal(false);
    await upgradeSubscription({ toPlan: targetUpgradePlan });
  };

  const handleConfirmDowngrade = () => {
    setShowDowngradeModal(false);
    // Convert 'launch' to 'starter' for the database
    const dbPlan = targetDowngradePlan === "launch" ? "starter" : targetDowngradePlan;
    scheduleDowngrade(dbPlan);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>

          <Tabs defaultValue={initialTab} className="space-y-6">
            <div className="overflow-x-auto -mx-6 px-6 pb-2">
              <TabsList className="w-max min-w-full sm:w-auto">
                <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Profile</span>
                  <span className="xs:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Subscription</span>
                  <span className="sm:hidden">Plan</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="sharing" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sharing</span>
                  <span className="sm:hidden">Share</span>
                  {!canShareReports && <Lock className="w-3 h-3 text-muted-foreground" />}
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
                  <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Integrations</span>
                  <span className="sm:hidden">Apps</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login');
                      }}
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              {subscriptionLoading || creditsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current Plan Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Current Plan
                            <Badge variant={isPaid ? "default" : "secondary"}>
                              {getPlanDisplayName()}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {getPlanDescription()}
                          </CardDescription>
                        </div>
                        {isPaid && subscription?.current_period_end && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Renews on</p>
                            <p className="text-sm font-medium">
                              {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pending Status Alerts */}
                      {hasPendingCancellation && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Cancellation Scheduled</p>
                            <p className="text-xs text-muted-foreground">
                              Your subscription ends on {subscription?.current_period_end && format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => reactivateSubscription()}
                            disabled={isReactivating}
                          >
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => cancelPendingDowngrade()}
                            disabled={isCancellingDowngrade}
                          >
                            {isCancellingDowngrade ? "..." : "Cancel"}
                          </Button>
                        </div>
                      )}

                      {!isPaid && (
                        <Button onClick={() => navigate("/pricing")} className="gap-2">
                          <Zap className="w-4 h-4" />
                          Upgrade to Pro
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {isPaid && !hasPendingCancellation && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                          <span>
                              {isPro ? "$199" : "$499"}/month
                              {subscription?.current_period_end && (
                                <> • Next billing: {format(new Date(subscription.current_period_end), "MMM d, yyyy")}</>
                              )}
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

                  {/* Plan Selector Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <SubscriptionPlanSelector
                        currentPlan={subscription?.plan || "starter"}
                        pendingPlan={subscription?.pending_plan || null}
                        pendingPlanDate={subscription?.pending_plan_effective_date || null}
                        hasPendingCancellation={hasPendingCancellation}
                        onUpgrade={handleUpgradeClick}
                        onDowngrade={handleDowngradeClick}
                        onCancelPendingDowngrade={() => cancelPendingDowngrade()}
                        isLoading={subscriptionActionLoading || isSchedulingDowngrade}
                        isCancellingDowngrade={isCancellingDowngrade}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {isPaid ? "Power-Up Credits" : "Credit Balance"}
                      </CardTitle>
                      <CardDescription>
                        {isPaid 
                          ? "Your credit balance and usage this billing cycle" 
                          : "Your Launch plan credit balance"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isPaid ? (
                        <>
                          {/* Two Stat Boxes Side by Side */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Credits Left */}
                            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                              <p className="text-3xl font-bold text-foreground">
                                {creditsRemaining.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">Credits Left</p>
                            </div>
                            
                            {/* Used This Cycle */}
                            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                              <p className="text-3xl font-bold text-foreground">
                                {creditsUsed.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">Used This Cycle</p>
                            </div>
                          </div>
                          
                          {/* Cycle Reset Date */}
                          {credits?.period_reset_at && (
                            <p className="text-xs text-muted-foreground">
                              Cycle resets on {format(new Date(credits.period_reset_at), "MMM d, yyyy")}
                            </p>
                          )}
                          
                          {/* Purchase Button */}
                          <Button 
                            onClick={() => setShowPowerUpModal(true)} 
                            className="w-full gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Purchase More Credits
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Single stat box for Launch users */}
                          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-3xl font-bold text-foreground">
                              {creditsRemaining.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Credits Remaining</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Each scan uses up to {PLAN_LIMITS.starter.nlocPerScan} credits (1 file max)
                          </p>
                          <Button onClick={() => navigate("/pricing")} className="w-full gap-2">
                            <Zap className="w-4 h-4" />
                            Upgrade to Pro for larger projects
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Billing History Link */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Billing History
                      </CardTitle>
                      <CardDescription>
                        View your past purchases and subscription changes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" onClick={() => navigate("/billing")}>
                        View Billing History
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>


            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-medium mb-2">Password</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Change your account password
                    </p>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sharing">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Report Sharing
                  </CardTitle>
                  <CardDescription>
                    {canShareReports 
                      ? "Share audit reports with collaborators directly from each report"
                      : "Upgrade to Business to share reports with others"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canShareReports ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        You can share individual audit reports with collaborators by clicking the "Share" button on any report. 
                        Collaborators will receive an in-app invitation and can accept or decline.
                      </p>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <ul className="space-y-2 text-sm text-foreground/90">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Share reports directly from the report page
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Collaborators get Business features on shared reports
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Comment on findings together
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-primary" />
                            Track remediation progress as a team
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <ul className="space-y-2 text-sm text-foreground/90">
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-500" />
                            Share audit reports with collaborators
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-500" />
                            Collaborators get Business features on shared reports
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-500" />
                            Comment on findings together
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-500" />
                            Track remediation progress as a team
                          </li>
                        </ul>
                      </div>
                      <Button onClick={() => navigate("/pricing")} className="gap-2">
                        <Zap className="w-4 h-4" />
                        Upgrade to Business
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="space-y-4">
                <GitHubIntegration />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MinimalFooter />

      {/* Power-Up Modal */}
      <PurchasePowerUpModal
        open={showPowerUpModal}
        onOpenChange={setShowPowerUpModal}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        accessUntil={subscription?.current_period_end ? new Date(subscription.current_period_end) : null}
        currentPlan={subscription?.plan || 'starter'}
        onConfirm={handleCancelSubscription}
        isLoading={subscriptionActionLoading}
      />

      {/* Upgrade Confirmation Modal */}
      <UpgradeConfirmationModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        fromPlan={plan}
        toPlan={targetUpgradePlan}
        prorationAmount={getProrationAmount()}
        onConfirm={handleConfirmUpgrade}
        isLoading={subscriptionActionLoading}
      />

      {/* Downgrade Warning Modal */}
      <DowngradeWarningModal
        open={showDowngradeModal}
        onOpenChange={setShowDowngradeModal}
        currentCredits={creditsRemaining}
        fromPlan={plan as "starter" | "pro" | "business"}
        toPlan={targetDowngradePlan === "launch" ? "starter" : targetDowngradePlan}
        onConfirm={handleConfirmDowngrade}
      />
    </div>
  );
};

export default Settings;
