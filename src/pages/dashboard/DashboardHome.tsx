import { useState, useEffect } from "react";
import WelcomeGreeting from "@/components/WelcomeGreeting";
import { useNavigate } from "react-router-dom";
import AuditCard from "@/components/AuditCard";
import { CreditBalance } from "@/components/CreditBalance";
import { LowCreditPrompt } from "@/components/LowCreditPrompt";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { DashboardStats } from "@/components/DashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import { ShareInvitationBanner } from "@/components/ShareInvitationBanner";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileCode, Trash2, ChevronRight, Zap, Plus } from "lucide-react";
import { AuditListSkeleton } from "@/components/AuditCardSkeleton";
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

const DashboardHome = () => {
  const navigate = useNavigate();
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name);
        if (!data.onboarding_completed) setShowWelcome(true);
      }
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

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-foreground">
              {getTimeBasedGreeting()}{displayName ? `, ${displayName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview of your security audit activity
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {subscription && (
            <Button onClick={() => navigate("/dashboard/new-audit")} className="gap-1.5">
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
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No active plan</p>
              <p className="text-xs text-muted-foreground">Subscribe to start running security analyses</p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/pricing")} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            View Plans
          </Button>
        </div>
      )}

      {/* Low Credit Warning */}
      {subscription && (subscription.plan === "pro" || subscription.plan === "business") &&
        (credits?.credits_remaining ?? 0) < 70 && (
          <LowCreditPrompt
            creditsRemaining={credits?.credits_remaining ?? 0}
            onPurchase={() => setShowPowerUpModal(true)}
          />
        )}

      {/* Stats Overview */}
      <DashboardStats />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Audits - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Audits</h3>
            {audits && audits.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/analyses")}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        aria-label="Delete audit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteAuditId(audit.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-border bg-card/50">
              <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No audits yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {subscription ? "Start a new audit to analyze your smart contracts" : "Subscribe to start running security analyses"}
              </p>
              {subscription ? (
                <Button onClick={() => navigate("/dashboard/new-audit")} className="gap-2">
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
        <div className="space-y-3 order-first lg:order-last">
          <SeverityBreakdown />
          <div className="hidden lg:block">
            <SecurityTrend />
          </div>
        </div>
      </div>

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
      {/* Welcome Greeting Overlay */}
      {showWelcome && user && (
        <WelcomeGreeting
          displayName={displayName}
          userId={user.id}
          onComplete={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
};

export default DashboardHome;
