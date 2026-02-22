import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import { CreditBalance } from "@/components/CreditBalance";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { LowCreditPrompt } from "@/components/LowCreditPrompt";
import { DashboardStats } from "@/components/DashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import { ShareInvitationBanner } from "@/components/ShareInvitationBanner";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileCode, Loader2, Trash2, ChevronRight, Zap, Terminal } from "lucide-react";
import { useAudits, useDeleteAudit } from "@/hooks/useAudits";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  const navigate = useNavigate();
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setDisplayName(data.display_name);
    };
    fetchProfile();
  }, [user]);

  const { data: audits, isLoading: auditsLoading } = useAudits();
  const deleteAudit = useDeleteAudit();
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();

  const handleViewResults = (auditId: string) => {
    navigate(`/reports/${auditId}`);
  };

  const handleDeleteAudit = async () => {
    if (!deleteAuditId) return;
    try {
      await deleteAudit.mutateAsync(deleteAuditId);
      toast.success("Audit deleted", { description: "The audit has been permanently removed." });
    } catch (error) {
      toast.error("Failed to delete", { description: "Please try again." });
    } finally {
      setDeleteAuditId(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="space-y-6">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {getTimeBasedGreeting()}{displayName ? `, ${displayName}` : ''}!
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Overview of your security analysis activity
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <CreditBalance />
            </div>
          </div>

          {/* Share Invitations Banner */}
          <ShareInvitationBanner />

          {/* Subscribe Prompt for users with no plan */}
          {!subscription && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">No active plan</p>
                <p className="text-xs text-muted-foreground">Subscribe to start running security analyses</p>
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")} className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                View Plans
              </Button>
            </div>
          )}

          {/* CLI Prompt */}
          {subscription && (
            <div className="p-4 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Run analyses via CLI</p>
                  <p className="text-xs text-muted-foreground">
                    Use the Solarizer CLI to start new security analyses
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/docs")} className="gap-1.5">
                View Docs
              </Button>
            </div>
          )}

          {/* Low Credit Warning */}
          {subscription && (subscription.plan === 'pro' || subscription.plan === 'business') && 
           (credits?.credits_remaining ?? 0) < 70 && (
            <LowCreditPrompt 
              creditsRemaining={credits?.credits_remaining ?? 0}
              onPurchase={() => setShowPowerUpModal(true)}
            />
          )}

          {/* Stats Overview */}
          <DashboardStats />
          
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Audits - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Analysis</h3>
                {audits && audits.length > 4 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/audits')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    View More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {auditsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : audits && audits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audits.slice(0, 4).map((audit) => {
                    const isOwned = audit.user_id === user?.id;
                    return (
                      <div key={audit.id} className="relative group">
                        <AuditCard
                          projectName={audit.project_name}
                          contractCount={audit.contract_count}
                          grade={audit.grade || undefined}
                          status={audit.status}
                          timestamp={formatTimestamp(audit.created_at)}
                          onClick={() => handleViewResults(audit.id)}
                          isShared={!isOwned}
                          hasShares={isOwned && (audit.share_count || 0) > 0}
                        />
                        {isOwned && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteAuditId(audit.id);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No assessments yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the Solarizer CLI to run your first security analysis
                  </p>
                  <Button onClick={() => navigate("/docs")} variant="outline" className="gap-2">
                    <Terminal className="w-4 h-4" />
                    Get Started
                  </Button>
                </div>
              )}
              
              <div className="lg:hidden">
                <SecurityTrend />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 order-first lg:order-last">
              <SeverityBreakdown />
              <div className="hidden lg:block">
                <SecurityTrend />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAuditId} onOpenChange={() => setDeleteAuditId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAudit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Power-Up Modal */}
      <PurchasePowerUpModal
        open={showPowerUpModal}
        onOpenChange={setShowPowerUpModal}
        requiredCredits={0}
        currentCredits={credits?.credits_remaining || 0}
      />

      {/* Subscribe Modal */}
      <AlertDialog open={showSubscribeModal} onOpenChange={setShowSubscribeModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Subscribe to Run Analysis
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You need an active plan to run security analyses. Choose a plan that fits your needs:</p>
                <div className="grid gap-2 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Spark</p>
                    <p className="text-xs text-muted-foreground">1 file per scan · 500 nLOC</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">$149/mo</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Blaze</p>
                    <p className="text-xs text-muted-foreground">Deep scan · 3,000 nLOC · 50 credits</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">$199/mo</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Inferno</p>
                    <p className="text-xs text-muted-foreground">12,000 nLOC · 50 credits · Sharing</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">$499/mo</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/pricing")}>
              View Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Index;
