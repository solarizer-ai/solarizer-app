import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Loader2, Check, CreditCard, Zap, Users, Lock, Link2, Receipt } from "lucide-react";
import { SettingsPageSkeleton } from "@/components/AuditCardSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { GitHubIntegration } from "@/components/settings/GitHubIntegration";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const { canShareReports } = useFeatureAccess();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SettingsPageSkeleton />
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
            <TabsList className="flex flex-wrap justify-start gap-1.5 h-auto p-1.5 bg-muted/50">
              <TabsTrigger value="profile" title="Profile" className="gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-background">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" title="Subscription" className="gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-background">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="security" title="Security" className="gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-background">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="sharing" title="Sharing" className="gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-background">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Sharing</span>
                {!canShareReports && <Lock className="w-3 h-3 text-muted-foreground" />}
              </TabsTrigger>
              <TabsTrigger value="integrations" title="Integrations" className="gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-background">
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Integrations</span>
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Manage your plan, credits, and billing from the dashboard.
                  </p>
                  <Button onClick={() => navigate("/dashboard/billing")} className="gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Go to Billing
                  </Button>
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
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!user?.email) return;
                      await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/settings` });
                      toast({ title: "Password reset email sent", description: "Check your inbox for the reset link" });
                    }}>
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
              <ApiKeyManager />
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
                      : "Upgrade to Inferno to share reports with others"}
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
                            Collaborators get Inferno features on shared reports
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
                            Collaborators get Inferno features on shared reports
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
                        Upgrade to Inferno
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

      <Footer />
    </div>
  );
};

export default Settings;
