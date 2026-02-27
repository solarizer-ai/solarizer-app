import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuditWizard from "@/components/AuditWizard";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
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
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();

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
      navigate("/dashboard");
      startScan(result.sessionId, data.projectName);
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

      <PurchasePowerUpModal
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
