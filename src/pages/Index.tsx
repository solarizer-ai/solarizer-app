import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import AuditWizard from "@/components/AuditWizard";
import ScanningProgress from "@/components/ScanningProgress";
import VulnerabilityMatrix from "@/components/VulnerabilityMatrix";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import { CreditBalance } from "@/components/CreditBalance";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { PurchasePowerUpModal } from "@/components/PurchasePowerUpModal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, FileCode, Loader2, Trash2 } from "lucide-react";
import { useAudits, useAudit, useFindings, useCreateAudit, useUpdateAudit, useDeleteAudit, useCreateFindings } from "@/hooks/useAudits";
import type { AuditStatus, SecurityGrade, FindingSeverity } from "@/hooks/useAudits";
import { useSubscription, useCredits, useScanCount, useDeductCredits } from "@/hooks/useSubscription";
import { calculateNLOC, PLAN_LIMITS } from "@/lib/nlocCalculator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { FileNode, getAllFiles } from "@/types/files";
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

// Mock findings generator (will be replaced by n8n integration later)
const generateMockFindings = (auditId: string) => [
  {
    audit_id: auditId,
    title: "Reentrancy Vulnerability in withdraw()",
    severity: "critical" as FindingSeverity,
    description: "The withdraw function updates the user's balance after the external call, making it vulnerable to reentrancy attacks.",
    location: "Vault.sol",
    line_start: 14,
    line_end: 18,
    code_snippet: `(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Transfer failed");
balances[msg.sender] -= amount;`,
    remediation: `Use the checks-effects-interactions pattern. Update the balance BEFORE making the external call.`,
  },
  {
    audit_id: auditId,
    title: "Missing Zero Address Validation",
    severity: "medium" as FindingSeverity,
    description: "The contract does not validate against zero addresses in critical functions.",
    location: "Vault.sol",
    line_start: 7,
    line_end: 8,
    code_snippet: `function deposit() external payable {
    balances[msg.sender] += msg.value;
}`,
    remediation: `Add require statements to validate addresses.`,
  },
  {
    audit_id: auditId,
    title: "Consider Using SafeMath for Arithmetic",
    severity: "low" as FindingSeverity,
    description: "While Solidity 0.8+ has built-in overflow protection, explicit SafeMath usage can make the code more readable.",
    location: "Vault.sol",
    line_start: 8,
    line_end: 8,
    code_snippet: `balances[msg.sender] += msg.value;`,
    remediation: `For enhanced readability, consider using SafeMath library.`,
  },
];

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
  
  // Memoized callback for findings filter
  const handleFilteredChange = useCallback((filtered: any[]) => setFilteredFindings(filtered), []);
  
  // Subscription & credits state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'scan_limit' | 'nloc_limit'>('scan_limit');
  const [pendingNloc, setPendingNloc] = useState(0);

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
    }
  }, [searchParams, setSearchParams]);

  const { toast } = useToast();
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
  const { data: scanCount } = useScanCount();
  const deductCredits = useDeductCredits();

  const handleStartScan = async (wizardData: { projectName: string; files: FileNode[]; code: string }) => {
    const { projectName: name, files, code: codeContent } = wizardData;
    
    // Calculate nLOC for enforcement
    const nloc = calculateNLOC(codeContent);
    const plan = subscription?.plan || 'starter';
    const currentScanCount = scanCount || 0;
    const creditsRemaining = credits?.credits_remaining || 0;
    
    // Starter plan enforcement
    if (plan === 'starter') {
      // Check scan limit
      if (currentScanCount >= PLAN_LIMITS.starter.maxScans) {
        setUpgradeReason('scan_limit');
        setShowUpgradeModal(true);
        return;
      }
      // Check nLOC limit per scan
      if (nloc > PLAN_LIMITS.starter.nlocPerScan) {
        setUpgradeReason('nloc_limit');
        setPendingNloc(nloc);
        setShowUpgradeModal(true);
        return;
      }
    }
    
    // Pro plan enforcement
    if (plan === 'pro') {
      if (nloc > creditsRemaining) {
        setPendingNloc(nloc);
        setShowPowerUpModal(true);
        return;
      }
    }
    
    setProjectName(name);
    setCode(codeContent);
    setIsScanning(true);
    setShowResults(false);

    try {
      const contractCount = getAllFiles(files).length || 1;
      
      const audit = await createAudit.mutateAsync({
        project_name: name,
        contract_code: codeContent,
        contract_count: contractCount,
        nloc_count: nloc,
      });

      setCurrentAuditId(audit.id);

      // Deduct credits for Pro users
      if (plan === 'pro') {
        await deductCredits.mutateAsync(nloc);
      }

      await updateAudit.mutateAsync({
        id: audit.id,
        status: "analyzing" as AuditStatus,
      });

    } catch (error) {
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "Failed to create audit",
        description: "Please try again.",
      });
    }
  };

  const handleScanComplete = async () => {
    if (!currentAuditId) return;

    try {
      // Generate mock findings (will be replaced by n8n)
      const mockFindings = generateMockFindings(currentAuditId);
      await createFindings.mutateAsync(mockFindings);

      // Calculate score and grade based on findings
      const criticalCount = mockFindings.filter(f => f.severity === "critical").length;
      const highCount = mockFindings.filter(f => f.severity === "high").length;
      const mediumCount = mockFindings.filter(f => f.severity === "medium").length;
      
      let score = 100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 5);
      score = Math.max(0, Math.min(100, score));
      
      let grade: SecurityGrade = "A";
      if (score < 50) grade = "F";
      else if (score < 60) grade = "D";
      else if (score < 70) grade = "C";
      else if (score < 85) grade = "B";

      // Update audit with results
      await updateAudit.mutateAsync({
        id: currentAuditId,
        status: criticalCount > 0 ? "issues" : "secured" as AuditStatus,
        grade,
        security_score: score,
      });

      setIsScanning(false);
      setShowResults(true);
    } catch (error) {
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "Failed to complete analysis",
        description: "Please try again.",
      });
    }
  };

  const handleNewAudit = () => {
    setSearchParams({});
    setView("editor");
    setShowResults(false);
    setIsScanning(false);
    setCurrentAuditId(null);
    setProjectName("");
    setCode(sampleCode);
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
      toast({
        title: "Audit deleted",
        description: "The audit has been permanently removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {view === "dashboard" && (
          <div className="space-y-8">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Recent Audits</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor and manage your smart contract security assessments
                </p>
              </div>
              <div className="flex items-center gap-4">
                <CreditBalance />
                <Button onClick={handleNewAudit} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Audit
                </Button>
              </div>
            </div>

            {/* Audit Grid */}
            {auditsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : audits && audits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audits.map((audit) => (
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
              <div className="text-center py-20 border border-dashed border-border rounded-lg">
                <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No audits yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first smart contract security audit
                </p>
                <Button onClick={handleNewAudit} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Audit
                </Button>
              </div>
            )}
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
              <h2 className="text-2xl font-semibold text-foreground">New Security Audit</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new smart contract security audit
              </p>
            </div>

            {!isScanning && !showResults && (
              <AuditWizard
                onComplete={handleStartScan}
                onCancel={handleBackToDashboard}
                isSubmitting={createAudit.isPending}
              />
            )}

            {(isScanning || showResults) && (
              <ScanningProgress 
                isScanning={isScanning} 
                onComplete={handleScanComplete}
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
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={handleBackToDashboard}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  ← Back to Dashboard
                </button>
                <h2 className="text-2xl font-semibold text-foreground">Security Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentAudit?.project_name || "Contract"} • Analyzed {currentAudit ? formatTimestamp(currentAudit.created_at) : ""}
                </p>
              </div>
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
                              ? `${f.line_start}-${f.line_end}`
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
    </div>
  );
};

export default Index;
