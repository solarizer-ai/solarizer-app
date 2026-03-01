import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import AuditWizard from "@/components/AuditWizard";
import { CreditBalance } from "@/components/CreditBalance";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { LowCreditPrompt } from "@/components/LowCreditPrompt";
import { DashboardStats } from "@/components/DashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import { ShareInvitationBanner } from "@/components/ShareInvitationBanner";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileCode, Trash2, ChevronRight, Zap, Plus, X } from "lucide-react";
import { AuditListSkeleton } from "@/components/AuditCardSkeleton";
import { useAudits, useDeleteAudit } from "@/hooks/useAudits";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useRunAudit } from "@/hooks/useRunAudit";
import { useScan } from "@/contexts/ScanContext";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAllFiles } from "@/types/files";
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const { user } = useAuth();
  const runAudit = useRunAudit();
  const { startScan, currentAuditId } = useScan();

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
    navigate(`/dashboard/reports/${auditId}`);
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

  const handleWizardComplete = async (data: { projectName: string; files: any[]; additionalContext?: string; scope: string[] }) => {
    const allFiles = getAllFiles(data.files);
    const flatFiles = allFiles.map(f => ({ name: f.path, content: f.content || '' }));

    try {
      const result = await runAudit.mutateAsync({
        projectName: data.projectName,
        files: flatFiles,
        scope: data.scope,
        additionalContext: data.additionalContext,
      });
      setShowWizard(false);
      startScan(result.sessionId, data.projectName);
    } catch (error: any) {
      const msg = error?.message || 'Failed to start audit';
      toast.error("Audit failed to start", { description: msg });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Wizard Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">New Security Analysis</h1>
              <Button variant="ghost" size="icon" onClick={() => setShowWizard(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AuditWizard
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
              isSubmitting={runAudit.isPending}
              subscription={subscription ? { plan: subscription.plan as 'starter' | 'pro' | 'business' } : null}
              credits={credits ? { credits_remaining: credits.credits_remaining, scans_remaining: credits.scans_remaining } : null}
              onUpgradeNeeded={(reason, nloc) => setShowUpgradeModal(true)}
              onPowerUpNeeded={() => setShowPowerUpModal(true)}
            />
          </div>
        </div>
      )}

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
              {subscription && (
                <Button onClick={() => setShowWizard(true)} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  New Audit
                </Button>
              )}
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

          {/* Low Credit Warning */}
          {subscription &&
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
                <AuditListSkeleton count={4} />
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
                  <h3 className="text-lg font-medium text-foreground mb-2">No audits yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {subscription ? "Start a new audit to analyze your smart contracts" : "Subscribe to start running security analyses"}
                  </p>
                  {subscription ? (
                    <Button onClick={() => setShowWizard(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      New Audit
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/pricing")} variant="outline" className="gap-2">
                      <Zap className="w-4 h-4" />
                      View Plans
                    </Button>
                  )}
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
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone.
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

      {/* Upgrade Modal */}
      <UpgradeToProModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />


      <Footer />
    </div>
  );
};

export default Index;
