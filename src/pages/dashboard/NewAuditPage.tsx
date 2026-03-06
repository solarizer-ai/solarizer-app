import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileCode, Lock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AuditWizard from "@/components/AuditWizard";
import { PurchaseCreditsModal } from "@/components/PurchaseCreditsModal";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { useSubscription, useCredits } from "@/hooks/useSubscription";
import { useRunAudit } from "@/hooks/useRunAudit";
import { useScan } from "@/contexts/ScanContext";
import { getAllFiles } from "@/types/files";
import { toast } from "sonner";

const NewAuditPage = () => {
  const navigate = useNavigate();
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [wizardProjectName, setWizardProjectName] = useState("");

  const runAudit = useRunAudit();
  const { startScan } = useScan();
  const { data: subscription, isExpired, isLoading: subscriptionLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();

  // Show loading skeleton while subscription/credits data is being fetched
  if (subscriptionLoading || creditsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-foreground">New Security Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure and launch your audit</p>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActivePlan = subscription?.status === 'active' && !isExpired;
  const hasCredits = credits && credits.credits_remaining > 0;

  // Gate: trial expired
  if (subscription?.plan === 'trial' && isExpired) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-foreground">New Security Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure and launch your audit</p>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Trial Ended</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your trial has ended — subscribe to continue running audits.
            </p>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gate: no active subscription
  if (!hasActivePlan) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-foreground">New Security Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure and launch your audit</p>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Subscription Required</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              A Spark, Blaze, or Inferno plan is required to run security audits.
            </p>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gate: zero credits
  if (!hasCredits) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-foreground">New Security Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure and launch your audit</p>
          </div>
        </div>
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50">
              <Zap className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">Insufficient Credits</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              You need credits to run security audits. Purchase credits to get started.
            </p>
            <Button onClick={() => setShowPowerUpModal(true)}>Purchase Credits</Button>
          </CardContent>
        </Card>
        <PurchaseCreditsModal
          open={showPowerUpModal}
          onOpenChange={setShowPowerUpModal}
        />
      </div>
    );
  }

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
      startScan(result.sessionId, data.projectName);
      navigate("/dashboard");
    } catch (error: any) {
      const msg = error?.message || 'Failed to start audit';
      toast.error("Audit failed to start", { description: msg });
    }
  };

  const handleUpgradeNeeded = (reason: 'nloc_limit' | 'file_limit', nloc: number) => {
    setUpgradeReason(reason === 'nloc_limit' ? `Your scope (~${nloc} nLOC) exceeds your plan limit.` : 'Your file count exceeds the plan limit.');
    setShowUpgradeModal(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">New Security Analysis</h1>
      </div>

      <AuditWizard
        onComplete={handleWizardComplete}
        onCancel={() => navigate("/dashboard")}
        isSubmitting={runAudit.isPending}
        subscription={subscription ? { plan: subscription.plan as 'starter' | 'pro' | 'business' } : null}
        credits={credits ? { credits_remaining: credits.credits_remaining, scans_remaining: credits.scans_remaining } : null}
        onUpgradeNeeded={handleUpgradeNeeded}
        onPowerUpNeeded={(creditsNeeded) => { setRequiredCredits(creditsNeeded); setShowPowerUpModal(true); }}
        onProjectNameChange={setWizardProjectName}
      />

      <PurchaseCreditsModal
        open={showPowerUpModal}
        onOpenChange={setShowPowerUpModal}
        requiredCredits={requiredCredits}
        currentCredits={credits?.credits_remaining || 0}
      />
      <UpgradeToProModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
      />
    </div>
  );
};

export default NewAuditPage;
