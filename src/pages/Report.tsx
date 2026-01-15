import { useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import SecurityCoverageTab from "@/components/SecurityCoverageTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { useAudit, useFindings } from "@/hooks/useAudits";
import { formatDistanceToNow } from "date-fns";
import type { CoverageData } from "@/hooks/useAudits";

const Report = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("coverage");
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);
  const findingRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  
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
    const filteredFindingsForCounts = findings.filter(f => f.severity !== "info");
    
    return {
      critical: filteredFindingsForCounts.filter(f => f.severity === "critical").length,
      high: filteredFindingsForCounts.filter(f => f.severity === "high").length,
      medium: filteredFindingsForCounts.filter(f => f.severity === "medium").length,
      low: filteredFindingsForCounts.filter(f => f.severity === "low").length,
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

  // Handle "View Issue" from coverage tab - switches to findings tab and scrolls to finding
  const handleViewIssue = useCallback((findingTitle: string) => {
    const finding = transformedFindings.find(f => f.title === findingTitle);
    if (finding) {
      // Switch to findings tab
      setActiveTab("findings");
      
      // Wait for tab content to render, then scroll
      setTimeout(() => {
        const element = findingRefs.current.get(finding.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedFindingId(finding.id);
          // Remove highlight after animation
          setTimeout(() => setHighlightedFindingId(null), 2000);
        }
      }, 100);
    }
  }, [transformedFindings]);

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
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Analysis Results</h2>
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
              {/* Security Score Card with Vulnerability Matrix */}
              <SecurityScoreCard
                grade={currentAudit.grade || "C"}
                score={currentAudit.security_score || 0}
                projectName={currentAudit.project_name}
                timestamp={formatTimestamp(currentAudit.created_at)}
                auditId={currentAudit.id}
                counts={getVulnerabilityCounts()}
              />

              {/* Tabbed Interface: Coverage & Findings */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="coverage" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Coverage
                  </TabsTrigger>
                  <TabsTrigger value="findings" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Findings ({transformedFindings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="coverage" className="mt-4">
                  <SecurityCoverageTab
                    coverageData={currentAudit?.coverage_data as CoverageData | null}
                    onViewIssue={handleViewIssue}
                  />
                </TabsContent>

                <TabsContent value="findings" className="mt-4">
                  <div className="space-y-4">
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
                              isHighlighted={highlightedFindingId === finding.id}
                              forceExpanded={highlightedFindingId === finding.id}
                              onRefReady={(el) => {
                                if (el) {
                                  findingRefs.current.set(finding.id, el);
                                }
                              }}
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
                </TabsContent>
              </Tabs>
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
