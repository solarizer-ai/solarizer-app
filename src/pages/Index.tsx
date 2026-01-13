import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import AuditWizard from "@/components/AuditWizard";
import ScanProgressWidget from "@/components/ScanProgressWidget";
import VulnerabilityMatrix from "@/components/VulnerabilityMatrix";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import { CreditBalance } from "@/components/CreditBalance";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { DashboardStats } from "@/components/DashboardStats";
import { useUpdateLifetimeStats } from "@/hooks/useDashboardStats";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";
import { SecurityTrend } from "@/components/SecurityTrend";
import MinimalFooter from "@/components/MinimalFooter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, FileCode, Loader2, Trash2 } from "lucide-react";
import { useAudits, useAudit, useFindings, useCreateAudit, useUpdateAudit, useDeleteAudit, useCreateFindings } from "@/hooks/useAudits";
import type { AuditStatus, SecurityGrade, FindingSeverity } from "@/hooks/useAudits";
import { useSubscription, useCredits, useDeductCredits } from "@/hooks/useSubscription";
import { useRunAudit } from "@/hooks/useRunAudit";
import { calculateNLOC, PLAN_LIMITS } from "@/lib/nlocCalculator";
import { formatDistanceToNow } from "date-fns";
import { FileNode, getAllFiles } from "@/types/files";
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

type AppView = "dashboard" | "editor" | "results";

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
  const [view, setView] = useState<AppView>("dashboard");
  const [code, setCode] = useState(sampleCode);
  const [projectName, setProjectName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  
  // Store files for the n8n API call
  const [pendingFiles, setPendingFiles] = useState<{ name: string; content: string }[]>([]);
  
  // Realtime findings during scan
  const [realtimeFindings, setRealtimeFindings] = useState<{ id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info' }[]>([]);
  const [realtimeAuditStatus, setRealtimeAuditStatus] = useState<'pending' | 'analyzing' | 'secured' | 'issues' | null>(null);
  
  // Widget visibility state
  const [showWidget, setShowWidget] = useState(false);
  // AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Memoized callback for findings filter
  const handleFilteredChange = useCallback((filtered: any[]) => setFilteredFindings(filtered), []);
  
  // Subscription & credits state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'scan_limit' | 'nloc_limit'>('scan_limit');
  const [pendingNloc, setPendingNloc] = useState(0);
  
  // Track current scan metrics for lifetime stats
  const [currentScanMetrics, setCurrentScanMetrics] = useState<{ contractCount: number; nlocCount: number } | null>(null);
  
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
    const auditId = searchParams.get('audit');
    const isNew = searchParams.get('new');
    
    if (auditId) {
      setCurrentAuditId(auditId);
      setView("results");
    } else if (isNew === 'true') {
      setView("editor");
      // Clear the param after handling
      setSearchParams({});
    } else {
      // Reset to dashboard when navigating to /dashboard without params
      setView("dashboard");
      setCurrentAuditId(null);
    }
  }, [searchParams, setSearchParams]);

  const { data: audits, isLoading: auditsLoading } = useAudits();
  const { data: currentAudit } = useAudit(currentAuditId);
  const { data: findings } = useFindings(currentAuditId);
  
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();
  const deleteAudit = useDeleteAudit();
  const createFindings = useCreateFindings();
  
  // Subscription hooks
  const { data: subscription } = useSubscription();
  const { data: credits } = useCredits();
  const deductCredits = useDeductCredits();
  const { updateStats: updateLifetimeStats } = useUpdateLifetimeStats();
  const runAudit = useRunAudit();

  const handleStartScan = async (wizardData: { projectName: string; files: FileNode[]; code: string; clocResult?: { totalNloc: number } }) => {
    const { projectName: name, files, code: codeContent, clocResult } = wizardData;
    
    // Use CLOC result from estimator step, fallback to local calculation
    const nloc = clocResult?.totalNloc || calculateNLOC(codeContent);
    const plan = subscription?.plan || 'starter';
    
    setProjectName(name);
    setCode(codeContent);
    setIsScanning(true);
    setShowResults(false);
    setRealtimeFindings([]);
    setRealtimeAuditStatus('analyzing');
    setShowWidget(true);
    
    // Show toast notification
    toast.info("Security analysis started", {
      description: `Analyzing ${name}...`,
      duration: 4000,
    });

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const contractCount = getAllFiles(files).length || 1;
      
      // Convert FileNode[] to simple file objects for API
      const fileList = getAllFiles(files).map(f => ({
        name: f.name,
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
      
      // Store metrics for lifetime stats update on completion
      setCurrentScanMetrics({ contractCount, nlocCount: nloc });

      // Deduct credits at scan START for ALL users
      await deductCredits.mutateAsync({ nlocAmount: nloc, plan });

      await updateAudit.mutateAsync({
        id: audit.id,
        status: "analyzing" as AuditStatus,
      });

      // Set up realtime subscriptions for findings and audit status
      const findingsChannel = supabase
        .channel(`findings-${audit.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'findings',
            filter: `audit_id=eq.${audit.id}`,
          },
          (payload) => {
            console.log('Realtime finding received:', payload.new);
            const newFinding = payload.new as { id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info' };
            setRealtimeFindings(prev => [...prev, {
              id: newFinding.id,
              title: newFinding.title,
              severity: newFinding.severity,
            }]);
          }
        )
        .subscribe();

      const auditChannel = supabase
        .channel(`audit-${audit.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'audits',
            filter: `id=eq.${audit.id}`,
          },
          (payload) => {
            console.log('Realtime audit update received:', payload.new);
            const updatedAudit = payload.new as { status: 'pending' | 'analyzing' | 'secured' | 'issues' };
            setRealtimeAuditStatus(updatedAudit.status);
            
            // If audit is complete, clean up
            if (updatedAudit.status === 'secured' || updatedAudit.status === 'issues') {
              supabase.removeChannel(findingsChannel);
              supabase.removeChannel(auditChannel);
              
              // Update lifetime stats
              if (currentScanMetrics) {
                updateLifetimeStats(
                  currentScanMetrics.contractCount,
                  realtimeFindings.length,
                  currentScanMetrics.nlocCount
                );
                setCurrentScanMetrics(null);
              }
              
              setIsScanning(false);
              setShowResults(true);
              abortControllerRef.current = null;
            }
          }
        )
        .subscribe();

      // Store channels for cleanup on cancel
      abortController.signal.addEventListener('abort', () => {
        supabase.removeChannel(findingsChannel);
        supabase.removeChannel(auditChannel);
      });

      // Call the run-audit edge function (fire-and-forget now)
      const result = await runAudit.mutateAsync({
        audit_id: audit.id,
        project_name: name,
        files: fileList,
        metadata: {
          nloc_count: nloc,
          contract_count: contractCount,
          plan: plan as 'starter' | 'pro',
        },
      });

      console.log('run-audit started:', result);

      // Navigate to dashboard to show progress widget
      setView("dashboard");

      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // The function now returns immediately - we wait for realtime updates

    } catch (error) {
      // Check if this was a cancellation
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setIsScanning(false);
      setRealtimeAuditStatus(null);
      abortControllerRef.current = null;
      toast.error("Failed to start analysis", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  
  const handleUpgradeNeeded = (reason: 'scan_limit' | 'nloc_limit', nloc: number) => {
    setUpgradeReason(reason);
    setPendingNloc(nloc);
    setShowUpgradeModal(true);
  };

  const handlePowerUpNeeded = (nloc: number) => {
    setPendingNloc(nloc);
    setShowPowerUpModal(true);
  };

  const handleCancelScan = async () => {
    // Abort the ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Update audit status back to pending
    if (currentAuditId) {
      try {
        await updateAudit.mutateAsync({
          id: currentAuditId,
          status: "pending" as AuditStatus,
        });
      } catch (e) {
        // Ignore errors when updating cancelled audit
      }
    }

    setIsScanning(false);
    setCurrentAuditId(null);
    setCurrentScanMetrics(null);
    setPendingFiles([]);
    setRealtimeFindings([]);
    setRealtimeAuditStatus(null);
    setShowWidget(false);

    toast.info("Analysis cancelled", {
      description: "Note: Credits used for this analysis have already been consumed.",
    });
  };

  const handleNewAudit = () => {
    setSearchParams({});
    setView("editor");
    setShowResults(false);
    setIsScanning(false);
    setCurrentAuditId(null);
    setProjectName("");
    setCode(sampleCode);
    setPendingFiles([]);
    setRealtimeFindings([]);
    setRealtimeAuditStatus(null);
    setShowWidget(false);
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
  };

  const handleBackToDashboard = () => {
    setSearchParams({});
    setView("dashboard");
    setCurrentAuditId(null);
  };

  const handleViewResults = (auditId?: string) => {
    if (auditId) {
      setCurrentAuditId(auditId);
    }
    setView("results");
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

  const getVulnerabilityCounts = () => {
    if (!findings) return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    
    return {
      critical: findings.filter(f => f.severity === "critical").length,
      high: findings.filter(f => f.severity === "high").length,
      medium: findings.filter(f => f.severity === "medium").length,
      low: findings.filter(f => f.severity === "low").length,
      info: findings.filter(f => f.severity === "info").length,
    };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8">
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
              <div className="flex items-center gap-3">
                <CreditBalance />
                <Button onClick={handleNewAudit} className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Run Analysis</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <DashboardStats />
            
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Audits - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-4">

                {/* Audit Grid */}
                {auditsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : audits && audits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audits.slice(0, 6).map((audit) => (
                      <div key={audit.id} className="relative group">
                        <AuditCard
                          projectName={audit.project_name}
                          contractCount={audit.contract_count}
                          grade={audit.grade || undefined}
                          status={audit.status}
                          timestamp={formatTimestamp(audit.created_at)}
                          onClick={() => handleViewResults(audit.id)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteAuditId(audit.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
              </div>

              {/* Sidebar - Takes 1 column */}
              <div className="space-y-4 order-first lg:order-last">
                <SeverityBreakdown />
                <SecurityTrend />
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
              <h2 className="text-2xl font-semibold text-foreground">New Security Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Run a new smart contract security analysis
              </p>
            </div>

            {!isScanning && !showResults && (
              <AuditWizard
                onComplete={handleStartScan}
                onCancel={handleBackToDashboard}
                isSubmitting={createAudit.isPending}
                subscription={subscription}
                credits={credits}
                onUpgradeNeeded={handleUpgradeNeeded}
                onPowerUpNeeded={handlePowerUpNeeded}
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
                        Found {findings?.filter(f => f.severity === 'critical').length || 0} critical, {findings?.filter(f => f.severity === 'high').length || 0} high, {findings?.filter(f => f.severity === 'medium').length || 0} medium issues
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleViewResults()} variant="outline" className="gap-2">
                    View Full Report
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "results" && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleBackToDashboard}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
              >
                ← Back to Dashboard
              </button>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Security Report</h2>
              <p className="text-sm text-muted-foreground">
                {currentAudit?.project_name || "Contract"} • Analyzed {currentAudit ? formatTimestamp(currentAudit.created_at) : ""}
              </p>
            </div>

            {currentAudit ? (
              <>
                {/* Security Score Card */}
                <SecurityScoreCard
                  grade={currentAudit.grade || "C"}
                  score={currentAudit.security_score || 0}
                  projectName={currentAudit.project_name}
                  timestamp={formatTimestamp(currentAudit.created_at)}
                  auditId={currentAudit.id}
                  findingsCount={{
                    passed: 42 - (findings?.length || 0),
                    warnings: findings?.filter(f => f.severity === 'medium' || f.severity === 'low').length || 0,
                    failed: findings?.filter(f => f.severity === 'critical' || f.severity === 'high').length || 0,
                  }}
                />

                {/* Vulnerability Matrix */}
                <VulnerabilityMatrix counts={getVulnerabilityCounts()} />

                {/* Findings List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Detailed Findings</h3>
                  {findings && findings.length > 0 ? (
                    <>
                      <FindingsFilter
                        findings={findings.map((f) => ({
                          id: f.id,
                          title: f.title,
                          severity: f.severity,
                          description: f.description,
                          location: f.location ? {
                            file: f.location,
                            lines: f.line_start && f.line_end 
                              ? (f.line_start === f.line_end ? `${f.line_start}` : `${f.line_start}-${f.line_end}`)
                              : undefined,
                          } : undefined,
                          code: f.code_snippet || undefined,
                          remediation: f.remediation || undefined,
                          is_resolved: f.is_resolved,
                        }))}
                        onFilteredChange={handleFilteredChange}
                      />
                      <div className="space-y-3">
                        {filteredFindings.map((finding) => (
                          <FindingItem 
                            key={finding.id} 
                            finding={finding} 
                          />
                        ))}
                        {filteredFindings.length === 0 && (
                          <p className="text-muted-foreground text-center py-8">No findings match your filters.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No findings for this audit.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        requiredNloc={pendingNloc}
        currentCredits={credits?.credits_remaining || 0}
      />

      {/* Scan Progress Widget */}
      <ScanProgressWidget
        isVisible={showWidget}
        projectName={projectName}
        findings={realtimeFindings}
        auditStatus={realtimeAuditStatus}
        onCancel={handleCancelScan}
        onViewResults={() => {
          if (currentAuditId) {
            handleViewResults(currentAuditId);
            setShowWidget(false);
          }
        }}
        onClose={handleCloseWidget}
      />

      <MinimalFooter />
    </div>
  );
};

export default Index;
