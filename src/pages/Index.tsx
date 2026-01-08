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
import { Plus, Play, ArrowRight } from "lucide-react";

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

const mockAudits = [
  { projectName: "DeFi Vault v2.1", contractCount: 3, grade: "A" as const, status: "secured" as const, timestamp: "2h ago" },
  { projectName: "NFT Marketplace", contractCount: 7, grade: "B" as const, status: "secured" as const, timestamp: "1d ago" },
  { projectName: "Token Bridge", contractCount: 2, status: "analyzing" as const, timestamp: "Just now" },
  { projectName: "Staking Protocol", contractCount: 5, grade: "C" as const, status: "issues" as const, timestamp: "3d ago" },
  { projectName: "DAO Governance", contractCount: 4, status: "pending" as const, timestamp: "5d ago" },
  { projectName: "Lending Pool", contractCount: 8, grade: "A" as const, status: "secured" as const, timestamp: "1w ago" },
];

const mockFindings = [
  {
    id: "1",
    title: "Reentrancy Vulnerability in withdraw()",
    severity: "critical" as const,
    description: "The withdraw function updates the user's balance after the external call, making it vulnerable to reentrancy attacks. An attacker could recursively call withdraw before the balance is updated.",
    location: { file: "Vault.sol", lines: "14-18" },
    code: `(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Transfer failed");
balances[msg.sender] -= amount;`,
    remediation: `Use the checks-effects-interactions pattern. Update the balance BEFORE making the external call:

balances[msg.sender] -= amount;
(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Transfer failed");

Alternatively, use OpenZeppelin's ReentrancyGuard modifier.`,
  },
  {
    id: "2",
    title: "Missing Zero Address Validation",
    severity: "medium" as const,
    description: "The contract does not validate against zero addresses in critical functions, which could lead to loss of funds if tokens are accidentally sent to the zero address.",
    location: { file: "Vault.sol", lines: "7-8" },
    code: `function deposit() external payable {
    balances[msg.sender] += msg.value;
}`,
    remediation: `Add require statements to validate addresses:

require(msg.sender != address(0), "Invalid sender");`,
  },
  {
    id: "3",
    title: "Consider Using SafeMath for Arithmetic",
    severity: "low" as const,
    description: "While Solidity 0.8+ has built-in overflow protection, explicit SafeMath usage can make the code more readable and intentions clearer.",
    location: { file: "Vault.sol", lines: "8" },
    code: `balances[msg.sender] += msg.value;`,
    remediation: `For enhanced readability and explicit overflow handling, consider:

using SafeMath for uint256;
balances[msg.sender] = balances[msg.sender].add(msg.value);`,
  },
];

const Index = () => {
  const [view, setView] = useState<AppView>("dashboard");
  const [code, setCode] = useState(sampleCode);
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    setShowResults(false);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
    setShowResults(true);
  };

  const handleNewAudit = () => {
    setView("editor");
    setShowResults(false);
    setIsScanning(false);
  };

  const handleViewResults = () => {
    setView("results");
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockAudits.map((audit, index) => (
                <AuditCard
                  key={index}
                  {...audit}
                  onClick={() => setView("results")}
                />
              ))}
            </div>
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
                disabled={isScanning}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                {isScanning ? "Scanning..." : "Start Analysis"}
              </Button>
            </div>

            {/* File Uploader */}
            <FileUploader onFilesSelected={(files) => {
              if (files.length > 0 && files[0].content) {
                setCode(files[0].content);
              }
            }} />

            {/* Code Editor */}
            <CodeEditor
              code={code}
              onChange={setCode}
              fileName="Contract.sol"
            />

            {/* Scanning Progress */}
            {(isScanning || showResults) && (
              <ScanningProgress 
                isScanning={isScanning} 
                onComplete={handleScanComplete}
              />
            )}

            {/* Quick Results Preview */}
            {showResults && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-warning">C</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">
                        Found 1 critical, 0 high, 1 medium, 1 low severity issues
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleViewResults} variant="outline" className="gap-2">
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
                  Vault.sol • Analyzed just now
                </p>
              </div>
            </div>

            {/* Security Score Card */}
            <SecurityScoreCard
              grade="C"
              score={68}
              projectName="Vault.sol"
              timestamp="Just now"
              onDownloadPDF={() => console.log("Download PDF")}
            />

            {/* Vulnerability Matrix */}
            <VulnerabilityMatrix
              counts={{
                critical: 1,
                high: 0,
                medium: 1,
                low: 1,
                info: 2,
              }}
            />

            {/* Findings List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Detailed Findings</h3>
              <div className="space-y-3">
                {mockFindings.map((finding) => (
                  <FindingItem key={finding.id} finding={finding} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
