import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import VulnerabilityMatrix from "@/components/VulnerabilityMatrix";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import { Loader2 } from "lucide-react";
import { useAudit, useFindings } from "@/hooks/useAudits";
import { formatDistanceToNow } from "date-fns";

const Report = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);

  // Memoized callback for findings filter
  const handleFilteredChange = useCallback((filtered: any[]) => setFilteredFindings(filtered), []);

  const { data: currentAudit, isLoading: auditLoading } = useAudit(auditId || null);
  const { data: findings } = useFindings(auditId || null);

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getVulnerabilityCounts = () => {
    if (!findings) return { critical: 0, high: 0, medium: 0, low: 0 };
    
    // Filter out info severity findings
    const filteredFindings = findings.filter(f => f.severity !== "info");
    
    return {
      critical: filteredFindings.filter(f => f.severity === "critical").length,
      high: filteredFindings.filter(f => f.severity === "high").length,
      medium: filteredFindings.filter(f => f.severity === "medium").length,
      low: filteredFindings.filter(f => f.severity === "low").length,
    };
  };

  // Memoize transformed findings to prevent infinite update loops
  const transformedFindings = useMemo(() => 
    (findings ?? [])
      .filter(f => f.severity !== "info")
      .map((f) => ({
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
      })),
    [findings]
  );

  const isLive = currentAudit?.status === 'analyzing';

  if (!auditId) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Security Report</h2>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentAudit?.project_name || "Contract"} • Analyzed {currentAudit ? formatTimestamp(currentAudit.created_at) : ""}
            </p>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : currentAudit ? (
            <>
              {/* Security Score Card */}
              <SecurityScoreCard
                grade={currentAudit.grade || "C"}
                score={currentAudit.security_score || 0}
                projectName={currentAudit.project_name}
                timestamp={formatTimestamp(currentAudit.created_at)}
                auditId={currentAudit.id}
              />

              {/* Vulnerability Matrix */}
              <VulnerabilityMatrix counts={getVulnerabilityCounts()} />

              {/* Findings List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Detailed Findings</h3>
                {transformedFindings.length > 0 ? (
                  <>
                    <FindingsFilter
                      findings={transformedFindings}
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
            <div className="text-center py-20">
              <p className="text-muted-foreground">Audit not found</p>
            </div>
          )}
        </div>
      </main>

      <MinimalFooter />
    </div>
  );
};

export default Report;
