import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuditCard from "@/components/AuditCard";
import { CreditBalance } from "@/components/CreditBalance";
import { LowCreditPrompt } from "@/components/LowCreditPrompt";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { DashboardStats } from "@/components/DashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import { ShareInvitationBanner } from "@/components/ShareInvitationBanner";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
import { Button } from "@/components/ui/button";
import { Trash2, Zap, Plus } from "lucide-react";
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

  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
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

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            {getTimeBasedGreeting()}{displayName ? `, ${displayName}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your security analysis activity
          </p>
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
          <TerminalPanel variant="data" noPadding>
            <div className="px-4 pt-4 md:px-5 md:pt-5">
              <TerminalDivider
                label="Recent Analysis"
                right={audits && audits.length > 4 ? (
                  <button
                    onClick={() => navigate("/dashboard/analyses")}
                    className="font-mono text-[11px] text-primary/60 hover:text-primary transition-colors cursor-pointer"
                  >
                    view all →
                  </button>
                ) : undefined}
              />
            </div>

            <div className="mt-2 pb-1">
              {auditsLoading ? (
                <div className="px-4 md:px-5 pb-4 space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="h-4 w-4 animate-pulse bg-white/[0.03] rounded" />
                      <div className="h-4 flex-1 animate-pulse bg-white/[0.03] rounded" />
                      <div className="h-4 w-12 animate-pulse bg-white/[0.03] rounded" />
                    </div>
                  ))}
                </div>
              ) : audits && audits.length > 0 ? (
                <>
                  {audits.slice(0, 6).map((audit) => {
                    const isOwned = audit.user_id === user?.id;
                    return (
                      <div key={audit.id} className="relative group">
                        <AuditCard
                          variant="dense"
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
                            className="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="px-4 md:px-5 pb-4 pt-2 text-center">
                  <p className="font-mono text-[12px] text-muted-foreground/40 mb-1">
                    ☐ No assessments yet
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground/30 mb-4">
                    {subscription ? "Start a new audit to analyze your contracts" : "Subscribe to start running security analyses"}
                  </p>
                  {subscription ? (
                    <Button size="sm" onClick={() => navigate("/dashboard/new-audit")} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      New Audit
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => navigate("/pricing")} variant="outline" className="gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      View Plans
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TerminalPanel>

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
    </div>
  );
};

export default DashboardHome;
