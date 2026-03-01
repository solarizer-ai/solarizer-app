import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import FindingItem from "@/components/FindingItem";
import FindingsFilter from "@/components/FindingsFilter";
import SecurityScoreCard from "@/components/SecurityScoreCard";
import SecurityCoverageTab from "@/components/SecurityCoverageTab";
import ScopeTab from "@/components/ScopeTab";
import ShareAuditModal from "@/components/ShareAuditModal";
import { UpgradeToProModal } from "@/components/UpgradeToProModal";
import { FeatureLockedOverlay } from "@/components/FeatureLockedOverlay";
import { RemediationProgressWidget } from "@/components/RemediationProgressWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, AlertTriangle, FileCode, Share2, Users, Download, Lock, Sparkles, XCircle, Archive, Lightbulb, ShieldCheck, Globe, LockKeyhole, Copy, Check } from "lucide-react";
import { ReportSkeleton } from "@/components/AuditCardSkeleton";
import { Switch } from "@/components/ui/switch";
import { useTogglePublicReport } from "@/hooks/useTogglePublicReport";
import InvariantsTab from "@/components/InvariantsTab";
import InsightsTab from "@/components/InsightsTab";
import { generateMarkdownReport, downloadMarkdown } from "@/lib/exportMarkdown";
import { toast } from "sonner";
import { useAudit, useFindings, useArchivedFindings } from "@/hooks/useAudits";
import { useAuth } from "@/hooks/useAuth";
import { useAuditShareCount, useAuditOwnerInfo } from "@/hooks/useAuditSharing";
import { useReportFeatureAccess } from "@/hooks/useReportFeatureAccess";
import { formatDistanceToNow } from "date-fns";
import type { CoverageData, Finding, FindingSeverity, Invariant, ArchitectureInsight } from "@/hooks/useAudits";
import { useAuditProgress } from "@/hooks/useAuditProgress";
import AuditProgressPanel from "@/components/AuditProgressPanel";
import { PHASE_LABELS } from "@/components/AuditProgressPanel";

const Report = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("scope");
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | null>(null);
  const findingRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const togglePublicMutation = useTogglePublicReport();
  
  // Contextual feature access based on audit ownership and owner's subscription
  const { 
    canViewRemediation, 
    canExportReport, 
    canViewQAFindings, 
    canShareReports,
    canCommentOnFindings,
    canEditCode,
    isOwner,
    effectivePlan,
    isLoading: accessLoading 
  } = useReportFeatureAccess(auditId || null);
  
  // Memoized callback for findings filter
  const handleFilteredChange = useCallback((filtered: any[]) => setFilteredFindings(filtered), []);

  const { data: currentAudit, isLoading: auditLoading } = useAudit(auditId || null);
  const { data: findings } = useFindings(auditId || null);
  const { data: archivedFindings } = useArchivedFindings(auditId || null);
  const { data: shareCount } = useAuditShareCount(auditId || null);

  // Get owner info for shared audits (use isOwner from hook)
  const { data: ownerInfo } = useAuditOwnerInfo(
    !isOwner && currentAudit ? currentAudit.user_id : null
  );

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getVulnerabilityCounts = () => {
    if (!findings) return { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 };
    
    return {
      critical: findings.filter(f => f.severity === "critical").length,
      high: findings.filter(f => f.severity === "high").length,
      medium: findings.filter(f => f.severity === "medium").length,
      low: findings.filter(f => f.severity === "low").length,
      info: findings.filter(f => f.severity === "info").length,
      gas: findings.filter(f => f.severity === "gas").length,
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
        location: (f.location || f.line_start) ? {
          file: f.location || null,
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

  // Filter findings based on plan - Starter users only see Critical, High, Medium
  const visibleFindings = useMemo(() => {
    if (canViewQAFindings) {
      return transformedFindings;
    }
    return transformedFindings.filter(f => 
      ['critical', 'high', 'medium'].includes(f.severity)
    );
  }, [transformedFindings, canViewQAFindings]);

  // Count hidden QA findings
  const hiddenQAFindingsCount = useMemo(() => {
    if (canViewQAFindings) return 0;
    return transformedFindings.filter(f => 
      ['low', 'info'].includes(f.severity)
    ).length;
  }, [transformedFindings, canViewQAFindings]);

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

  const handleExportMarkdown = () => {
    if (!canExportReport) {
      setUpgradeModalOpen(true);
      return;
    }

    if (!currentAudit || !findings) {
      toast.error("Unable to export report");
      return;
    }

    const markdown = generateMarkdownReport({
      audit: currentAudit,
      findings: findings,
      vulnerabilityCounts: getVulnerabilityCounts(),
    });

    const filename = `${currentAudit.project_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-audit-report.md`;
    downloadMarkdown(markdown, filename);
    toast.success("Report exported successfully");
  };

  // Show toast notification when viewing a failed or cancelled audit
  const [hasShownFailedToast, setHasShownFailedToast] = useState(false);
  useEffect(() => {
    if (currentAudit?.status === 'failed' && !hasShownFailedToast) {
      toast.error("Analysis Failed", {
        description: "This analysis encountered an error. If credits were charged, they will be refunded.",
        duration: 8000,
      });
      setHasShownFailedToast(true);
    }
  }, [currentAudit?.status, currentAudit?.id, hasShownFailedToast]);

  // Helper to check if audit is failed or cancelled (for hiding buttons)
  const isFailedOrCancelled = currentAudit?.status === 'failed' || currentAudit?.status === 'cancelled';

  const handleShareClick = () => {
    if (!canShareReports) {
      toast.info("Sharing reports requires a Business plan");
      return;
    }
    setShareModalOpen(true);
  };

  const isLive = currentAudit?.status === 'analyzing';
  const { data: orchestration } = useAuditProgress(auditId || null, isLive);
  const queryClient = useQueryClient();

  // Auto-transition when orchestration completes
  useEffect(() => {
    if (
      orchestration?.status === 'completed' ||
      orchestration?.status === 'cancelled' ||
      orchestration?.status === 'failed'
    ) {
      queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
      queryClient.invalidateQueries({ queryKey: ['findings', auditId] });
    }
  }, [orchestration?.status, auditId, queryClient]);

  if (!auditId) {
    navigate("/dashboard");
    return null;
  }

  // Get owner email for the share modal
  const currentUserEmail = user?.email || null;

  return (
    <>
      <div className="space-y-6">
          {/* Results Header */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                {currentAudit?.project_name || "Contract"}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {!isOwner && currentAudit && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Users className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {ownerInfo 
                        ? `Shared by ${ownerInfo.display_name || ownerInfo.email}`
                        : "Shared"
                      }
                    </span>
                    <span className="sm:hidden">Shared</span>
                  </Badge>
                )}
                {isOwner && shareCount > 0 && (
                  <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
                    <Share2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Sharing with {shareCount}</span>
                    <span className="sm:hidden">{shareCount}</span>
                  </Badge>
                )}
                {isOwner && canShareReports && !isFailedOrCancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareClick}
                    className="gap-1.5 h-8"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                )}
                {currentAudit?.status !== 'analyzing' && currentAudit?.status !== 'pending' && !isFailedOrCancelled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportMarkdown}
                          className={`gap-1.5 h-8 ${!canExportReport ? 'opacity-75' : ''}`}
                        >
                          {!canExportReport && <Lock className="w-3 h-3" />}
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Export</span>
                        </Button>
                      </TooltipTrigger>
                      {!canExportReport && (
                        <TooltipContent>
                          <p>Upgrade to Blaze to export reports</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Public/Private Toggle — Inferno only */}
                {canShareReports && !isFailedOrCancelled && currentAudit?.status !== 'analyzing' && currentAudit?.status !== 'pending' && (
                  <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            {(currentAudit as any)?.is_public ? (
                              <Globe className="w-4 h-4 text-primary" />
                            ) : (
                              <LockKeyhole className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Switch
                              checked={(currentAudit as any)?.is_public || false}
                              disabled={togglePublicMutation.isPending}
                              onCheckedChange={(checked) => {
                                togglePublicMutation.mutate(
                                  { auditId: currentAudit!.id, isPublic: checked },
                                  {
                                    onSuccess: (slug) => {
                                      if (checked && slug) {
                                        toast.success("Report is now public", {
                                          description: "Anyone with the link can view this report",
                                        });
                                      } else {
                                        toast.success("Report is now private");
                                      }
                                    },
                                    onError: () => toast.error("Failed to update visibility"),
                                  }
                                );
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{(currentAudit as any)?.is_public ? "Report is public — anyone with the link can view" : "Make report public"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {(currentAudit as any)?.is_public && (currentAudit as any)?.public_slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => {
                          const url = `${window.location.origin}/report/${(currentAudit as any).public_slug}`;
                          navigator.clipboard.writeText(url).then(() => {
                            setPublicLinkCopied(true);
                            toast.success("Public link copied!");
                            setTimeout(() => setPublicLinkCopied(false), 2000);
                          });
                        }}
                      >
                        {publicLinkCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{publicLinkCopied ? "Copied" : "Copy Link"}</span>
                      </Button>
                    )}
                  </div>
                )}
                {/* Locked public toggle for non-Inferno owners */}
                {isOwner && !canShareReports && !isFailedOrCancelled && currentAudit?.status !== 'analyzing' && currentAudit?.status !== 'pending' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 pl-2 border-l border-border ml-1 opacity-50 cursor-not-allowed">
                          <LockKeyhole className="w-4 h-4 text-muted-foreground" />
                          <Switch checked={false} disabled />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upgrade to Inferno to make reports public</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {isLive ? (
              <p className="text-sm text-muted-foreground animate-pulse">
                {orchestration?.phase
                  ? `Analysing · ${PHASE_LABELS[orchestration.phase] || orchestration.phase}`
                  : 'Analysing...'}
              </p>
            ) : currentAudit ? (
              <p className="text-sm text-muted-foreground">
                Analysed {formatTimestamp(currentAudit.created_at)}
              </p>
            ) : null}
          </div>

          {auditLoading ? (
            <ReportSkeleton />
          ) : currentAudit ? (
            <>
              {(currentAudit.status === 'failed' || currentAudit.status === 'cancelled') ? (
                /* Failed/Cancelled audit: Show only warning message */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <XCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {currentAudit.status === 'cancelled' ? 'Analysis Cancelled' : 'Analysis Failed'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    {currentAudit.status === 'cancelled'
                      ? 'This analysis was cancelled.'
                      : 'This analysis encountered an error and could not be completed.'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    {currentAudit.status === 'cancelled'
                      ? "You can start a new analysis whenever you're ready."
                      : 'If credits were charged, they will be refunded. Please try again, or contact support if the issue persists.'
                    }
                  </p>
                  {(currentAudit as any).refund_failed && (
                    <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning max-w-md text-left">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Your credits couldn't be refunded automatically.{" "}
                        <a href="mailto:support@solarizer.io" className="font-medium underline">
                          Contact support
                        </a>{" "}
                        with audit ID:{" "}
                        <code className="font-mono text-xs">{currentAudit.id}</code>
                      </span>
                    </div>
                  )}
                  <Button 
                    onClick={() => navigate("/dashboard?new=true")} 
                    className="gap-2"
                  >
                    Start New Analysis
                  </Button>
                </div>
              ) : (
                /* Normal audit: Show all content */
                <>
                  {/* Live Progress Panel - shown during analysis */}
                  {isLive && orchestration && (
                    <AuditProgressPanel
                      orchestration={orchestration}
                      scopeMetadata={currentAudit.scope_metadata as any[] | null}
                      liveFindings={visibleFindings as { severity: string }[]}
                    />
                  )}

                  {/* Security Score Card - hidden during analysis */}
                  {!isLive && (
                    <SecurityScoreCard
                      grade={currentAudit.grade || null}
                      projectName={currentAudit.project_name}
                      timestamp={formatTimestamp(currentAudit.created_at)}
                      auditId={currentAudit.id}
                      counts={getVulnerabilityCounts()}
                      onSeverityClick={(sev) => {
                        setSeverityFilter(sev as FindingSeverity);
                        setActiveTab("findings");
                      }}
                    />
                  )}
                  
                  {!isLive && (
                    <>
                      {/* Remediation Progress - Business only */}
                      {canCommentOnFindings && (
                        <RemediationProgressWidget auditId={currentAudit.id} />
                      )}

                      {/* Tabbed Interface: Scope, Coverage & Findings */}
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="flex w-full overflow-x-auto no-scrollbar">
                      <TabsTrigger value="scope" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Scope
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Insights
{effectivePlan !== 'business' && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </TabsTrigger>
                      <TabsTrigger value="invariants" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Invariants
                        {effectivePlan === 'starter' && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </TabsTrigger>
                      <TabsTrigger value="findings" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Findings
                      </TabsTrigger>
                      <TabsTrigger value="coverage" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Coverage
                      </TabsTrigger>
                      <TabsTrigger value="archive" className="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm px-3 py-2">
                        <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Archive
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="scope" className="mt-4">
                      <ScopeTab
                        coverageData={currentAudit?.coverage_data as CoverageData | null}
                        findings={(findings ?? []) as Finding[]}
                        contractCount={currentAudit?.contract_count || 0}
                        nlocCount={currentAudit?.nloc_count || null}
                        readOnly={!canEditCode}
                        auditStatus={currentAudit?.status}
                        systemHologram={currentAudit?.system_hologram as { scope?: string[]; all_files?: string[] } | null}
                        scopeMetadata={currentAudit?.scope_metadata}
                        contextMetadata={currentAudit?.context_metadata}
                        orchestrationScopeFiles={(orchestration?.request_payload as any)?.scopeFiles}
                        orchestrationContextFiles={(orchestration?.request_payload as any)?.contextFiles}
                      />
                    </TabsContent>

                    <TabsContent value="findings" className="mt-4">
                      <div className="space-y-4">
                        {/* QA Findings Upgrade Banner */}
                        {hiddenQAFindingsCount > 0 && (
                          <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {hiddenQAFindingsCount} additional QA finding{hiddenQAFindingsCount !== 1 ? 's' : ''} available
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Upgrade to Blaze to view Low and Informational findings
                                </p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => setUpgradeModalOpen(true)}>
                              Upgrade to Blaze
                            </Button>
                          </div>
                        )}

                        {visibleFindings.length > 0 ? (
                          <>
                            <FindingsFilter
                              findings={visibleFindings}
                              onFilteredChange={handleFilteredChange}
                              hiddenSeverities={!canViewQAFindings ? ['low', 'info'] : []}
                              defaultSeverity={severityFilter}
                            />
                            <div className="space-y-3">
                              {filteredFindings.map((finding) => (
                                <FindingItem 
                                  key={finding.id} 
                                  finding={finding}
                                  isHighlighted={highlightedFindingId === finding.id}
                                  forceExpanded={highlightedFindingId === finding.id}
                                  canViewRemediation={canViewRemediation}
                                  canCommentOnFindings={canCommentOnFindings}
                                  currentUserId={user?.id}
                                  onUpgradeClick={() => setUpgradeModalOpen(true)}
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

                    <TabsContent value="archive" className="mt-4">
                      <div className="space-y-4">
                        {archivedFindings && archivedFindings.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              These findings were marked as false positives during verification and excluded from the security score.
                            </p>
                            {archivedFindings.map((f) => (
                              <FindingItem
                                key={f.id}
                                finding={{
                                  id: f.id,
                                  title: f.title,
                                  severity: f.severity,
                                  description: f.description,
                                  location: (f.location || f.line_start) ? {
                                    file: f.location || null,
                                    lines: f.line_start && f.line_end
                                      ? (f.line_start === f.line_end ? `${f.line_start}` : `${f.line_start}-${f.line_end}`)
                                      : undefined,
                                  } : undefined,
                                  code: f.code_snippet || undefined,
                                  startLine: f.line_start || 1,
                                  remediation: f.remediation || undefined,
                                  is_resolved: f.is_resolved,
                                }}
                                canViewRemediation={canViewRemediation}
                                canCommentOnFindings={false}
                                currentUserId={user?.id}
                                onUpgradeClick={() => setUpgradeModalOpen(true)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">No archived findings.</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="invariants" className="mt-4">
                      {effectivePlan === 'starter' ? (
                        <FeatureLockedOverlay
                          featureName="System Invariants"
                          requiredPlan="pro"
                          description="Invariant analysis identifies protocol-level assumptions that must always hold."
                          onUpgrade={() => setUpgradeModalOpen(true)}
                        />
                      ) : (
                        <InvariantsTab
                          invariants={
                            (currentAudit?.system_hologram as Record<string, unknown> | null)?.invariants as Invariant[] | undefined ?? null
                          }
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="coverage" className="mt-4">
                      <SecurityCoverageTab
                        coverageData={currentAudit?.coverage_data as CoverageData | null}
                        onViewIssue={handleViewIssue}
                      />
                    </TabsContent>

                    <TabsContent value="insights" className="mt-4">
                      {effectivePlan !== 'business' ? (
                        <FeatureLockedOverlay
                          featureName="Architecture Insights"
                          requiredPlan="business"
                          description="Architecture insights provide a high-level review of protocol design and composability risks."
                          onUpgrade={() => setUpgradeModalOpen(true)}
                        />
                      ) : (
                        <InsightsTab
                          insights={
                            (currentAudit?.system_hologram as Record<string, unknown> | null)?.insights as ArchitectureInsight[] | undefined ?? null
                          }
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Audit not found</p>
            </div>
          )}
        </div>

      {/* Share Modal */}
      {currentAudit && (
        <ShareAuditModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          auditId={currentAudit.id}
          ownerEmail={currentUserEmail}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeToProModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        reason="nloc_limit"
      />
    </>
  );
};

export default Report;
