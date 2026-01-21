import { FileCode, FileText, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoverageData, CoverageTestDetail } from "@/components/SecurityCoverageTab";
import type { Finding } from "@/hooks/useAudits";

interface ContractSummary {
  name: string;
  testsCount: number;
  passedCount: number;
  failedCount: number;
  issuesCount: number;
  highestSeverity: string | null;
}

interface ScopeTabProps {
  coverageData: CoverageData | null;
  findings: Finding[];
  contractCount: number;
  nlocCount: number | null;
  readOnly?: boolean;
}

const ScopeTab = ({ coverageData, findings, contractCount, nlocCount, readOnly = false }: ScopeTabProps) => {
  // Extract unique contracts from coverage data
  const contractSummaries: ContractSummary[] = (() => {
    if (!coverageData?.details?.length) return [];

    const contractMap = new Map<string, ContractSummary>();

    coverageData.details.forEach((test) => {
      const contractName = test.file || "Unknown";
      
      if (!contractMap.has(contractName)) {
        contractMap.set(contractName, {
          name: contractName,
          testsCount: 0,
          passedCount: 0,
          failedCount: 0,
          issuesCount: 0,
          highestSeverity: null,
        });
      }

      const summary = contractMap.get(contractName)!;
      summary.testsCount++;
      if (test.status === "PASSED") {
        summary.passedCount++;
      } else {
        summary.failedCount++;
      }
    });

    // Count issues per contract from findings
    findings.forEach((finding) => {
      const location = finding.location;
      if (location) {
        // Try to match finding location to contract
        contractMap.forEach((summary, contractName) => {
          if (location.includes(contractName) || contractName.includes(location)) {
            summary.issuesCount++;
            // Track highest severity
            const severityOrder = ["critical", "high", "medium", "low", "info"];
            const currentIdx = severityOrder.indexOf(summary.highestSeverity || "");
            const newIdx = severityOrder.indexOf(finding.severity);
            if (newIdx !== -1 && (currentIdx === -1 || newIdx < currentIdx)) {
              summary.highestSeverity = finding.severity;
            }
          }
        });
      }
    });

    return Array.from(contractMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    
    const config: Record<string, { bg: string; text: string; label: string }> = {
      critical: { bg: "bg-destructive/10", text: "text-destructive", label: "Critical" },
      high: { bg: "bg-orange-500/10", text: "text-orange-500", label: "High" },
      medium: { bg: "bg-warning/10", text: "text-warning", label: "Medium" },
      low: { bg: "bg-primary/10", text: "text-primary", label: "Low" },
      info: { bg: "bg-slate-400/10", text: "text-slate-400", label: "Info" },
    };
    
    const style = config[severity];
    if (!style) return null;
    
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", style.bg, style.text)}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Audit Scope</h3>
            <p className="text-sm text-muted-foreground">
              Contracts and files included in this security audit
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{contractCount} Contracts</span>
          </div>
          {nlocCount !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{nlocCount.toLocaleString()} Lines of Code</span>
            </div>
          )}
        </div>
      </div>

      {/* Contract List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Contracts in Scope
        </h4>
        
        {contractSummaries.length > 0 ? (
          <div className="space-y-2">
            {contractSummaries.map((contract) => (
              <div 
                key={contract.name}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileCode className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground font-mono text-sm truncate">
                        {contract.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          {contract.passedCount} passed
                        </span>
                        {contract.failedCount > 0 && (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                            {contract.failedCount} failed
                          </span>
                        )}
                        {contract.issuesCount > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            {contract.issuesCount} {contract.issuesCount === 1 ? "issue" : "issues"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {contract.highestSeverity && getSeverityBadge(contract.highestSeverity)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No contract scope data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeTab;