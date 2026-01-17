import { useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import SecurityCoverageTab from "@/components/SecurityCoverageTab";
import ScopeTab from "@/components/ScopeTab";
import ShareAuditModal from "@/components/ShareAuditModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, AlertTriangle, FileCode, Share2, Users } from "lucide-react";
import { useAudit, useFindings } from "@/hooks/useAudits";
import { useAuth } from "@/hooks/useAuth";
import { useAuditShareCount, useAuditOwnerInfo } from "@/hooks/useAuditSharing";
import { formatDistanceToNow } from "date-fns";
import type { CoverageData, Finding } from "@/hooks/useAudits";

const Report = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("scope");
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const findingRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  
  // Memoized callback for findings filter
  const handleFilteredChange = useCallback((filtered: any[]) => setFilteredFindings(filtered), []);

  const { data: currentAudit, isLoading: auditLoading } = useAudit(auditId || null);
  const { data: findings } = useFindings(auditId || null);
  const { data: shareCount } = useAuditShareCount(auditId || null);

  // Check if current user is the owner
  const isOwner = user?.id === currentAudit?.user_id;

  // Get owner info for shared audits
  const { data: ownerInfo } = useAuditOwnerInfo(
    !isOwner && currentAudit ? currentAudit.user_id : null
  );

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

  // Memoize transformed findings to prevent infinite update loops
  const transformedFindings = useMemo(() => 
    (findings ?? [])
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
        startLine: f.line_start || 1,
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

  // Get owner email for the share modal
  const currentUserEmail = user?.email || null;

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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Analysis Results</h2>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs text-success font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Live
                </span>
              )}
{!isOwner && currentAudit && (
                <Badge variant="secondary" className="gap-1.5">
                  <Users className="w-3 h-3" />
                  {ownerInfo 
                    ? `Shared by ${ownerInfo.display_name || ownerInfo.email}`
                    : "Shared"
                  }
                </Badge>
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShareModalOpen(true)}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
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
                grade={currentAudit.grade || null}
                score={currentAudit.security_score || 0}
                projectName={currentAudit.project_name}
                timestamp={formatTimestamp(currentAudit.created_at)}
                auditId={currentAudit.id}
                counts={getVulnerabilityCounts()}
              />

              {/* Tabbed Interface: Scope, Coverage & Findings */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="scope" className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Scope
                  </TabsTrigger>
                  <TabsTrigger value="coverage" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Coverage
                  </TabsTrigger>
                  <TabsTrigger value="findings" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Findings ({transformedFindings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scope" className="mt-4">
                  <ScopeTab
                    coverageData={currentAudit?.coverage_data as CoverageData | null}
                    findings={(findings ?? []) as Finding[]}
                    contractCount={currentAudit?.contract_count || 0}
                    nlocCount={currentAudit?.nloc_count || null}
                  />
                </TabsContent>

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

      {/* Share Modal */}
      {currentAudit && (
        <ShareAuditModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          auditId={currentAudit.id}
          ownerEmail={currentUserEmail}
        />
      )}
    </div>
  );
};

export default Report;
