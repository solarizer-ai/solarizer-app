import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import AuditWizard from "@/components/AuditWizard";
import { CreditBalance } from "@/components/CreditBalance";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { LowCreditPrompt } from "@/components/LowCreditPrompt";
import { DashboardStats } from "@/components/DashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import { ShareInvitationBanner } from "@/components/ShareInvitationBanner";
import { AnalysisInProgressModal } from "@/components/AnalysisInProgressModal";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, FileCode, Loader2, Trash2, ChevronRight, Zap } from "lucide-react";
import { useAudits, useAudit, useCreateAudit, useUpdateAudit, useDeleteAudit } from "@/hooks/useAudits";
import type { AuditStatus } from "@/hooks/useAudits";
import { useSubscription, useCredits, useDeductCredits } from "@/hooks/useSubscription";
import { useRunAudit } from "@/hooks/useRunAudit";
import { calculateNLOC } from "@/lib/nlocCalculator";
import { formatDistanceToNow } from "date-fns";
import { FileNode, getAllFiles } from "@/types/files";
import { useAuth } from "@/hooks/useAuth";
import { useScan } from "@/contexts/ScanContext";
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

type AppView = "dashboard" | "editor";

const sampleCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Vault {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Vulnerability: State change after external call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
    }
    
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
}`;

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [view, setView] = useState<AppView>("dashboard");
  const [code, setCode] = useState(sampleCode);
  const [projectName, setProjectName] = useState("");
  const [wizardProjectName, setWizardProjectName] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  
  // Store files for the n8n API call
  const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
  
  // Global scan context
  const { startScan, isScanning } = useScan();
  
  // Subscribe modal for users with no plan
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  
  // Subscription & credits state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'nloc_limit' | 'file_limit'>('nloc_limit');
  const [pendingNloc, setPendingNloc] = useState(0);
  
  // Auth and profile
  const { user } = useAuth();
  
  // Fetch user profile for welcome message
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

  // Handle URL query params
  useEffect(() => {
    const isNew = searchParams.get('new');
    
    if (isNew === 'true') {
      setView("editor");
      // Clear the param after handling
      setSearchParams({});
    } else {
      // Reset to dashboard
      setView("dashboard");
      setCurrentAuditId(null);
    }
  }, [searchParams, setSearchParams]);

  const { data: audits, isLoading: auditsLoading } = useAudits();
  const { data: currentAudit } = useAudit(currentAuditId);
  
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();
  const deleteAudit = useDeleteAudit();
  
  // Subscription hooks
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();
  const deductCredits = useDeductCredits();
  const runAudit = useRunAudit();
  const queryClient = useQueryClient();


  const handleStartScan = async (wizardData: { 
    projectName: string; 
    files: FileNode[]; 
    code: string; 
    clocResult?: { totalNloc: number }; 
    additionalContext?: string;
    scope?: string[];
  }) => {
    const { projectName: name, files, code: codeContent, clocResult, additionalContext, scope } = wizardData;
    
    // Use CLOC result from estimator step, fallback to local calculation
    const nloc = clocResult?.totalNloc || calculateNLOC(codeContent);
    const plan = subscription?.plan || 'starter';
    
    // Block if no subscription
    if (!subscription) {
      toast.error("No active plan", {
        description: "Please subscribe to a plan before running an analysis.",
        action: {
          label: "View Plans",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }
    
    setProjectName(name);
    setCode(codeContent);
    setShowResults(false);

    try {
      const contractCount = getAllFiles(files).length || 1;
      
      // Convert FileNode[] to simple file objects for API - use full path for n8n backend
      const fileList = getAllFiles(files).map(f => ({
        name: f.path || f.name,  // Full path e.g. "src/Constants.sol", fallback to name
        content: f.content || '',
      }));
      setPendingFiles(fileList);
      
      const audit = await createAudit.mutateAsync({
        project_name: name,
        contract_code: codeContent,
        contract_count: contractCount,
        nloc_count: nloc,
      });

      setCurrentAuditId(audit.id);

      // Start global scan (sets up realtime subscriptions in context)
      startScan(audit.id, name);

      // Navigate to dashboard IMMEDIATELY so user sees progress widget
      setView("dashboard");

      // Deduct credits at scan START for ALL users
      await deductCredits.mutateAsync({ nlocAmount: nloc, plan });

      await updateAudit.mutateAsync({
        id: audit.id,
        status: "analyzing" as AuditStatus,
      });

      // Call the run-audit edge function (fire-and-forget now)
      const result = await runAudit.mutateAsync({
        audit_id: audit.id,
        project_name: name,
        files: fileList,
        scope: scope || fileList.map(f => f.name),  // Pass scope, default to all files
        additional_context: additionalContext,
        metadata: {
          nloc_count: nloc,
          contract_count: contractCount,
          plan: plan as 'starter' | 'pro',
        },
      });

      console.log('run-audit started:', result);

    } catch (error) {
      toast.error("Failed to start analysis", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  
  const handleUpgradeNeeded = (reason: 'nloc_limit' | 'file_limit', nloc: number) => {
    setUpgradeReason(reason);
    setPendingNloc(nloc);
    setShowUpgradeModal(true);
  };

  const handlePowerUpNeeded = (nloc: number) => {
    setPendingNloc(nloc);
    setShowPowerUpModal(true);
  };

  const handleNewAudit = () => {
    // If no subscription, show subscribe prompt
    if (!subscription) {
      setShowSubscribeModal(true);
      return;
    }
    
    
    setSearchParams({});
    setView("editor");
    setShowResults(false);
    setCurrentAuditId(null);
    setProjectName("");
    setWizardProjectName("");
    setCode(sampleCode);
    setPendingFiles([]);
  };

  const handleBackToDashboard = () => {
    setSearchParams({});
    setView("dashboard");
    setCurrentAuditId(null);
    setWizardProjectName("");
  };

  const handleViewResults = (auditId: string) => {
    navigate(`/reports/${auditId}`);
  };

  const handleDeleteAudit = async () => {
    if (!deleteAuditId) return;
    
    try {
      await deleteAudit.mutateAsync(deleteAuditId);
      toast.success("Audit deleted", {
        description: "The audit has been permanently removed.",
      });
    } catch (error) {
      toast.error("Failed to delete", {
        description: "Please try again.",
      });
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
        {view === "dashboard" && (
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
                <Button onClick={handleNewAudit} className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Run Analysis</span>
                  <span className="sm:hidden">New</span>
                </Button>
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
                
                {/* Section Header */}
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

                {/* Audit Grid */}
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
                      Start your first smart contract security analysis
                    </p>
                    <Button onClick={handleNewAudit} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Run Analysis
                    </Button>
                  </div>
                )}
                
                {/* Score Trend - Mobile only, directly below Recent Analysis */}
                <div className="lg:hidden">
                  <SecurityTrend />
                </div>
              </div>

              {/* Sidebar - Takes 1 column */}
              <div className="space-y-4 order-first lg:order-last">
                <SeverityBreakdown />
                {/* Score Trend - Desktop only */}
                <div className="hidden lg:block">
                  <SecurityTrend />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "editor" && (
          <div className="space-y-6">
            <div>
              <button 
                onClick={handleBackToDashboard}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                ← Back to Dashboard
              </button>
              <h2 className="text-2xl font-semibold text-foreground">
                {wizardProjectName || "New Security Analysis"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Run a new smart contract security analysis
              </p>
            </div>

            {!showResults && (
              <AuditWizard
                onComplete={handleStartScan}
                onCancel={handleBackToDashboard}
                isSubmitting={createAudit.isPending}
                subscription={subscription}
                credits={credits}
                onUpgradeNeeded={handleUpgradeNeeded}
                onPowerUpNeeded={handlePowerUpNeeded}
                onProjectNameChange={setWizardProjectName}
              />
            )}

            {showResults && currentAudit && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      currentAudit.grade === 'A' ? 'bg-success/10 border border-success/20' :
                      currentAudit.grade === 'B' ? 'bg-success/10 border border-success/20' :
                      currentAudit.grade === 'C' ? 'bg-warning/10 border border-warning/20' :
                      'bg-destructive/10 border border-destructive/20'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        currentAudit.grade === 'A' || currentAudit.grade === 'B' ? 'text-success' :
                        currentAudit.grade === 'C' ? 'text-warning' : 'text-destructive'
                      }`}>{currentAudit.grade}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Security analysis finished
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => currentAuditId && handleViewResults(currentAuditId)} variant="outline" className="gap-2">
                    View Full Report
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Upgrade Modal */}
      <UpgradeToProModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason={upgradeReason}
        currentNloc={pendingNloc}
      />

      {/* Power-Up Modal */}
      <PurchasePowerUpModal
        open={showPowerUpModal}
        onOpenChange={setShowPowerUpModal}
        requiredCredits={pendingNloc}
        currentCredits={credits?.credits_remaining || 0}
      />

      {/* Analysis In Progress Modal */}
      <AnalysisInProgressModal
        open={showAnalysisModal}
        onOpenChange={setShowAnalysisModal}
      />

      {/* Subscribe Modal for users with no plan */}
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
                    <p className="text-sm font-medium text-foreground">Launch</p>
                    <p className="text-xs text-muted-foreground">1 file per scan · 150 nLOC</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">$49/mo</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/40 bg-primary/5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Pro</p>
                    <p className="text-xs text-muted-foreground">Unlimited files · 50 nLOC credits</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">$299/mo</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Business</p>
                    <p className="text-xs text-muted-foreground">Unlimited files · 50 nLOC credits · Sharing</p>
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
