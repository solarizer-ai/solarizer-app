import { useState } from "react";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import FileUploader from "@/components/FileUploader";
import CodeEditor from "@/components/CodeEditor";
import ScanningProgress from "@/components/ScanningProgress";
import VulnerabilityMatrix from "@/components/VulnerabilityMatrix";
import FindingItem from "@/components/FindingItem";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Play, ArrowRight, FileCode, Loader2, Trash2 } from "lucide-react";
import { useAudits, useAudit, useFindings, useCreateAudit, useUpdateAudit, useDeleteAudit, useCreateFindings } from "@/hooks/useAudits";
import type { AuditStatus, SecurityGrade, FindingSeverity } from "@/hooks/useAudits";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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
  const [view, setView] = useState<AppView>("dashboard");
  const [code, setCode] = useState(sampleCode);
  const [projectName, setProjectName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);

  const { toast } = useToast();
  const { data: audits, isLoading: auditsLoading } = useAudits();
  const { data: currentAudit } = useAudit(currentAuditId);
  const { data: findings } = useFindings(currentAuditId);
  
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();
  const deleteAudit = useDeleteAudit();
  const createFindings = useCreateFindings();

  const handleStartScan = async () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project name required",
        description: "Please enter a name for your project.",
      });
      return;
    }

    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "No code provided",
        description: "Please paste or upload your Solidity contract.",
      });
      return;
    }

    setIsScanning(true);
    setShowResults(false);

    try {
      // Create the audit
      const audit = await createAudit.mutateAsync({
        project_name: projectName,
        contract_code: code,
        contract_count: 1,
      });

      setCurrentAuditId(audit.id);

      // Update status to analyzing
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
    setView("editor");
    setShowResults(false);
    setIsScanning(false);
    setCurrentAuditId(null);
    setProjectName("");
    setCode(sampleCode);
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
              <Button onClick={handleNewAudit} className="gap-2">
                <Plus className="w-4 h-4" />
                New Audit
              </Button>
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
            {/* Editor Header */}
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setView("dashboard")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  ← Back to Dashboard
                </button>
                <h2 className="text-2xl font-semibold text-foreground">New Security Audit</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your Solidity contracts or paste code directly
                </p>
              </div>
              <Button 
                onClick={handleStartScan}
                disabled={isScanning || createAudit.isPending}
                className="gap-2"
              >
                {isScanning || createAudit.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isScanning ? "Scanning..." : "Start Analysis"}
              </Button>
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="e.g., DeFi Vault v2.1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* File Uploader */}
            <FileUploader onFilesSelected={(files) => {
              if (files.length > 0 && files[0].content) {
                setCode(files[0].content);
                if (!projectName && files[0].name) {
                  setProjectName(files[0].name.replace('.sol', ''));
                }
              }
            }} />

            {/* Code Editor */}
            <CodeEditor
              code={code}
              onChange={setCode}
              fileName={projectName ? `${projectName}.sol` : "Contract.sol"}
            />

            {/* Scanning Progress */}
            {(isScanning || showResults) && (
              <ScanningProgress 
                isScanning={isScanning} 
                onComplete={handleScanComplete}
              />
            )}

            {/* Quick Results Preview */}
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
                  onClick={() => setView("dashboard")}
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
                  onDownloadPDF={() => console.log("Download PDF")}
                />

                {/* Vulnerability Matrix */}
                <VulnerabilityMatrix counts={getVulnerabilityCounts()} />

                {/* Findings List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Detailed Findings</h3>
                  {findings && findings.length > 0 ? (
                    <div className="space-y-3">
                      {findings.map((finding) => (
                        <FindingItem 
                          key={finding.id} 
                          finding={{
                            id: finding.id,
                            title: finding.title,
                            severity: finding.severity,
                            description: finding.description,
                            location: finding.location ? {
                              file: finding.location,
                              lines: finding.line_start && finding.line_end 
                                ? `${finding.line_start}-${finding.line_end}`
                                : undefined,
                            } : undefined,
                            code: finding.code_snippet || undefined,
                            remediation: finding.remediation || undefined,
                          }} 
                        />
                      ))}
                    </div>
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
    </div>
  );
};

export default Index;
