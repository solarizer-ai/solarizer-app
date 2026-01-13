import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, Loader2, Check, CreditCard, Zap, Calendar, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";
import { format } from "date-fns";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();

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
  const creditsRemaining = credits?.credits_remaining || 0;
  const creditsUsed = credits?.credits_used_this_period || 0;
  const totalCredits = isPro ? PLAN_LIMITS.pro.monthlyNloc : PLAN_LIMITS.starter.maxScans * PLAN_LIMITS.starter.nlocPerScan;
  const usagePercent = totalCredits > 0 ? Math.min(100, (creditsUsed / totalCredits) * 100) : 0;

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

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
            </TabsList>

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
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
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
                            <Badge variant={isPro ? "default" : "secondary"}>
                              {isPro ? "Pro" : "Starter"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {isPro 
                              ? "Unlimited scans with 1,500 nLOC monthly allowance" 
                              : "2 free scans with 500 nLOC per scan"}
                          </CardDescription>
                        </div>
                        {isPro && subscription?.current_period_end && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Renews on</p>
                            <p className="text-sm font-medium">
                              {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!isPro && (
                        <Button onClick={() => navigate("/pricing")} className="gap-2">
                          <Zap className="w-4 h-4" />
                          Upgrade to Pro
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      )}
                      {isPro && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>$19/month • Next billing: {subscription?.current_period_end ? format(new Date(subscription.current_period_end), "MMM d, yyyy") : "—"}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Usage Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage This Period</CardTitle>
                      <CardDescription>
                        {isPro 
                          ? "Your nLOC credit usage for this billing cycle" 
                          : "Your scan usage"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isPro ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">nLOC Used</span>
                            <span className="font-medium">
                              {creditsUsed.toLocaleString()} / {totalCredits.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={usagePercent} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Credits Remaining</span>
                            <span className="font-medium text-primary">
                              {creditsRemaining.toLocaleString()} nLOC
                            </span>
                          </div>
                          {credits?.period_reset_at && (
                            <p className="text-xs text-muted-foreground">
                              Credits reset on {format(new Date(credits.period_reset_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Scans Remaining</span>
                            <span className="font-medium">
                              {credits?.scans_remaining ?? 0} / {PLAN_LIMITS.starter.maxScans}
                            </span>
                          </div>
                          <Progress 
                            value={((credits?.scans_remaining ?? 0) / PLAN_LIMITS.starter.maxScans) * 100} 
                            className="h-2" 
                          />
                          <p className="text-xs text-muted-foreground">
                            Each scan limited to {PLAN_LIMITS.starter.nlocPerScan} nLOC
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Power-Up Card (Pro only) */}
                  {isPro && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          Need More Credits?
                        </CardTitle>
                        <CardDescription>
                          Purchase additional nLOC for large analyses
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" onClick={() => navigate("/pricing")}>
                          View Power-Up Options
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Power-up credits expire at the end of your current billing period
                        </p>
                      </CardContent>
                    </Card>
                  )}

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

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when an analysis finishes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Critical Findings</p>
                      <p className="text-sm text-muted-foreground">
                        Immediate alerts for critical vulnerabilities
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Weekly digest of your security activity
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    * Notification features coming soon
                  </p>
                </CardContent>
              </Card>
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
          </Tabs>
        </div>
      </main>

      <MinimalFooter />
    </div>
  );
};

export default Settings;
