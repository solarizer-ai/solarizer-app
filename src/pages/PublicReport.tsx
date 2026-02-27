import { useParams } from "react-router-dom";
import { usePublicAudit, usePublicFindings } from "@/hooks/usePublicAudit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CodeBlock from "@/components/CodeBlock";
import { Loader2, Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info, Zap, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import solarLogo from "@/assets/solarizer-logo.png";

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info", "gas"] as const;

const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: "Critical", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <ShieldAlert className="w-4 h-4" /> },
  high: { label: "High", color: "bg-destructive/20 text-red-400 border-destructive/30", icon: <AlertTriangle className="w-4 h-4" /> },
  medium: { label: "Medium", color: "bg-warning/20 text-amber-400 border-warning/30", icon: <AlertTriangle className="w-4 h-4" /> },
  low: { label: "Low", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Info className="w-4 h-4" /> },
  info: { label: "Info", color: "bg-muted text-muted-foreground border-border", icon: <Info className="w-4 h-4" /> },
  gas: { label: "Gas", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <Zap className="w-4 h-4" /> },
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 border-green-500/40",
  B: "text-blue-400 border-blue-500/40",
  C: "text-amber-400 border-amber-500/40",
  D: "text-orange-400 border-orange-500/40",
  F: "text-red-400 border-red-500/40",
};

const PublicReport = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: audit, isLoading: auditLoading, error: auditError } = usePublicAudit(slug || null);
  const { data: findings } = usePublicFindings(audit?.id || null);

  if (auditLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (auditError || !audit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">Report Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            This report may have been made private or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const severityCounts = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = (findings || []).filter(f => f.severity === sev).length;
    return acc;
  }, {} as Record<string, number>);

  const groupedFindings = SEVERITY_ORDER
    .filter(sev => severityCounts[sev] > 0)
    .map(sev => ({
      severity: sev,
      findings: (findings || []).filter(f => f.severity === sev),
    }));

  const scopeFiles = (() => {
    try {
      const sm = audit.scope_metadata;
      if (Array.isArray(sm)) return sm.map((f: any) => f.name || f.path || f).filter(Boolean);
      return [];
    } catch { return []; }
  })();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={solarLogo} alt="Solarizer" className="h-7 w-auto" />
            <div className="h-5 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Security Audit Report</span>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            Public Report
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">
        {/* Project Info */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{audit.project_name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Audited {format(new Date(audit.created_at), "MMM d, yyyy")}</span>
            {audit.nloc_count && (
              <>
                <span className="text-border">·</span>
                <span>{audit.nloc_count.toLocaleString()} nLOC</span>
              </>
            )}
            <span className="text-border">·</span>
            <span>{(findings || []).length} findings</span>
          </div>
        </div>

        {/* Score Card */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Grade */}
              {audit.grade && (
                <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl font-bold ${GRADE_COLORS[audit.grade] || "text-muted-foreground border-border"}`}>
                  {audit.grade}
                </div>
              )}
              {/* Score */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-3xl font-bold text-foreground">{audit.security_score ?? "—"}<span className="text-lg text-muted-foreground">/100</span></p>
              </div>
              {/* Severity Breakdown */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SEVERITY_ORDER.map(sev => {
                  const count = severityCounts[sev];
                  if (!count) return null;
                  const cfg = SEVERITY_CONFIG[sev];
                  return (
                    <div key={sev} className={`px-3 py-1.5 rounded-md border text-xs font-medium ${cfg.color}`}>
                      {cfg.label}: {count}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scope */}
        {scopeFiles.length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Scope ({scopeFiles.length} files)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1">
                {scopeFiles.map((file: string, i: number) => (
                  <div key={i} className="text-sm font-mono text-muted-foreground py-0.5">
                    {file}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Findings by Severity */}
        {groupedFindings.map(({ severity, findings: groupFindings }) => {
          const cfg = SEVERITY_CONFIG[severity];
          return (
            <div key={severity} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {cfg.icon}
                {cfg.label} ({groupFindings.length})
              </h2>
              <div className="space-y-3">
                {groupFindings.map(finding => (
                  <Card key={finding.id} className="border-border overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{finding.title}</h3>
                            <Badge className={`text-[10px] ${cfg.color} border`} variant="outline">
                              {cfg.label}
                            </Badge>
                          </div>
                          {finding.location && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {finding.location}
                              {finding.line_start && `:${finding.line_start}`}
                              {finding.line_end && finding.line_end !== finding.line_start && `-${finding.line_end}`}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {finding.is_resolved ? (
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolved
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="w-3.5 h-3.5" />
                              Open
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed">{finding.description}</p>

                      {finding.code_snippet && (
                        <CodeBlock
                          code={finding.code_snippet}
                          language="solidity"
                          startLine={finding.line_start || 1}
                        />
                      )}

                      {finding.remediation && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 space-y-1">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Remediation</p>
                          <p className="text-sm text-foreground/80">{finding.remediation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* No findings */}
        {(!findings || findings.length === 0) && (
          <div className="text-center py-12">
            <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-foreground font-medium">No vulnerabilities found</p>
            <p className="text-sm text-muted-foreground">This project passed security analysis with no issues.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src={solarLogo} alt="Solarizer" className="h-5 w-auto opacity-60" />
          </div>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            This report was generated by Solarizer, an AI-powered smart contract security analysis engine by Eryonix Techlabs.
            This is an automated analysis and should be reviewed by security professionals before making critical decisions.
          </p>
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Eryonix Techlabs · solarizer.eryonix.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicReport;
