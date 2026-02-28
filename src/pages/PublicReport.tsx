import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicAudit, usePublicFindings } from "@/hooks/usePublicAudit";
import CodeBlock from "@/components/CodeBlock";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Loader2, Shield, ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle,
  Info, Zap, Fuel, CheckCircle2, XCircle, ChevronDown, FileCode, Lightbulb,
  Calendar, Code2, Bug, CircleCheckBig,
} from "lucide-react";
import { ReportSkeleton } from "@/components/AuditCardSkeleton";
import { format } from "date-fns";
import solarLogo from "@/assets/solarizer-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ── Severity config (matching FindingItem) ──────────────────────────
type Severity = "critical" | "high" | "medium" | "low" | "info" | "gas";

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info", "gas"];

const severityConfig: Record<Severity, {
  icon: typeof AlertTriangle;
  label: string;
  className: string;
  barColor: string;
}> = {
  critical: { icon: ShieldAlert, label: "Critical", className: "text-critical bg-critical/10 border-critical/30", barColor: "bg-critical" },
  high: { icon: AlertTriangle, label: "High", className: "text-destructive bg-destructive/10 border-destructive/30", barColor: "bg-destructive" },
  medium: { icon: AlertCircle, label: "Medium", className: "text-warning bg-warning/10 border-warning/30", barColor: "bg-warning" },
  low: { icon: Info, label: "Low", className: "text-low bg-low/10 border-low/30", barColor: "bg-low" },
  info: { icon: Info, label: "Info", className: "text-slate-400 bg-slate-400/10 border-slate-400/30", barColor: "bg-slate-400" },
  gas: { icon: Fuel, label: "Gas", className: "text-green-500 bg-green-500/10 border-green-500/30", barColor: "bg-green-500" },
};

// ── Grade config (matching SecurityScoreCard) ──────────────────────
const gradeConfig: Record<string, { color: string; stroke: string; label: string; description: string }> = {
  A: { color: "text-success", stroke: "stroke-success", label: "Excellent", description: "No critical vulnerabilities detected" },
  B: { color: "text-success", stroke: "stroke-success", label: "Good", description: "Minor issues that should be addressed" },
  C: { color: "text-warning", stroke: "stroke-warning", label: "Fair", description: "Several issues requiring attention" },
  D: { color: "text-warning", stroke: "stroke-warning", label: "Poor", description: "Significant vulnerabilities detected" },
  F: { color: "text-critical", stroke: "stroke-critical", label: "Critical", description: "Critical security flaws present" },
};

// ── Solidity syntax highlighting (from FindingItem) ─────────────────
const solidityKeywords = new Set([
  'function','contract','pragma','solidity','public','private','external','internal',
  'view','pure','payable','returns','return','if','else','for','while','require',
  'assert','revert','modifier','event','emit','mapping','struct','enum','import',
  'using','library','interface','constructor','memory','storage','calldata','virtual',
  'override','constant','immutable','new','delete','true','false','this','super','is',
  'abstract','indexed','anonymous','unchecked',
]);
const solidityTypes = new Set([
  'uint','uint256','uint128','uint64','uint32','uint16','uint8','int','int256','int128',
  'int64','int32','int16','int8','address','bool','string','bytes','bytes32','bytes4','bytes20',
]);

const highlightSolidityCode = (code: string | undefined, startLine: number = 1) => {
  if (!code) return null;
  const lines = code.split('\n');
  const maxLineNumber = startLine + lines.length - 1;
  const lineNumberWidth = Math.max(3, String(maxLineNumber).length);

  return lines.map((line, lineIndex) => {
    const lineNumber = startLine + lineIndex;
    const tokens: JSX.Element[] = [];
    let remaining = line;
    let tokenIndex = 0;

    while (remaining.length > 0) {
      const commentMatch = remaining.match(/^(\/\/.*)/);
      if (commentMatch) { tokens.push(<span key={`${lineIndex}-${tokenIndex++}`} className="text-muted-foreground italic">{commentMatch[1]}</span>); remaining = remaining.slice(commentMatch[1].length); continue; }
      const stringMatch = remaining.match(/^("[^"]*"|'[^']*')/);
      if (stringMatch) { tokens.push(<span key={`${lineIndex}-${tokenIndex++}`} className="text-green-400">{stringMatch[1]}</span>); remaining = remaining.slice(stringMatch[1].length); continue; }
      const numberMatch = remaining.match(/^(0x[0-9a-fA-F]+|\d+)/);
      if (numberMatch) { tokens.push(<span key={`${lineIndex}-${tokenIndex++}`} className="text-orange-400">{numberMatch[1]}</span>); remaining = remaining.slice(numberMatch[1].length); continue; }
      const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (wordMatch) {
        const word = wordMatch[1];
        let cls = "text-foreground/90";
        if (solidityKeywords.has(word)) cls = "text-purple-400";
        else if (solidityTypes.has(word) || word.startsWith('uint') || word.startsWith('int') || word.startsWith('bytes')) cls = "text-blue-400";
        tokens.push(<span key={`${lineIndex}-${tokenIndex++}`} className={cls}>{word}</span>);
        remaining = remaining.slice(word.length); continue;
      }
      tokens.push(<span key={`${lineIndex}-${tokenIndex++}`} className="text-foreground/90">{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIndex} className="flex leading-relaxed">
        <span className="pr-3 text-right text-muted-foreground/50 select-none shrink-0 border-r border-border/50 mr-3" style={{ width: `${lineNumberWidth + 1}ch` }}>{lineNumber}</span>
        <span className="flex-1">{tokens.length > 0 ? tokens : '\u00A0'}</span>
      </div>
    );
  });
};

// ── Inline formatting helpers (from FindingItem) ────────────────────
const parseInlineFormatting = (text: string, keyPrefix: string): JSX.Element[] => {
  const result: JSX.Element[] = [];
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(inlinePattern);
  parts.forEach((part, index) => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      const isLabel = boldContent.endsWith(':');
      if (isLabel) {
        result.push(<strong key={`${keyPrefix}-${index}`} className="block mt-3 mb-1 font-semibold text-foreground">{boldContent}</strong>);
      } else {
        result.push(<strong key={`${keyPrefix}-${index}`} className="font-semibold text-foreground">{boldContent}</strong>);
      }
    } else if (part.startsWith('`') && part.endsWith('`')) {
      result.push(<code key={`${keyPrefix}-${index}`} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-primary">{part.slice(1, -1)}</code>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      result.push(<em key={`${keyPrefix}-${index}`} className="italic text-foreground/90">{part.slice(1, -1)}</em>);
    } else {
      result.push(<span key={`${keyPrefix}-${index}`}>{part}</span>);
    }
  });
  return result;
};

const renderNumberedList = (text: string, keyPrefix: string) => {
  const lines = text.split('\n');
  const listItems: { content: string }[] = [];
  const prefixLines: string[] = [];
  const suffixLines: string[] = [];
  let foundFirstItem = false;
  let listEnded = false;
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match && !listEnded) { foundFirstItem = true; listItems.push({ content: match[2] }); }
    else if (!foundFirstItem && line.trim()) prefixLines.push(line);
    else if (foundFirstItem && !match) { if (line.trim()) { listEnded = true; suffixLines.push(line); } else if (listEnded) suffixLines.push(line); }
  }
  if (listItems.length === 0) return null;
  return {
    prefixText: prefixLines.join(' '),
    list: (
      <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-sm text-foreground/90 pl-1">{parseInlineFormatting(item.content, `${keyPrefix}-li-${idx}`)}</li>
        ))}
      </ol>
    ),
    suffixText: suffixLines.join(' ').trim(),
  };
};

const renderWithCodeFormatting = (text: string) => {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/```\s*(\w+)\s*\n/g, '```$1\n');
  const blockPattern = /```(\w+)?(?:\n|\s)?([\s\S]*?)```/g;
  const segments: (string | { type: 'codeblock'; language?: string; code: string })[] = [];
  let lastIndex = 0;
  let match;
  while ((match = blockPattern.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) segments.push(normalizedText.slice(lastIndex, match.index));
    segments.push({ type: 'codeblock', language: match[1], code: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < normalizedText.length) segments.push(normalizedText.slice(lastIndex));

  return segments.map((segment, segmentIndex) => {
    if (typeof segment === 'object' && segment.type === 'codeblock') {
      const isSolidity = segment.language === 'solidity' || segment.language === 'sol';
      return <CodeBlock key={segmentIndex} code={segment.code} language={segment.language} useHighlighting={isSolidity} highlightFn={isSolidity ? highlightSolidityCode : undefined} />;
    }
    const textSegment = segment as string;
    const listMatch = textSegment.match(/(?:^|\n)(\d+)\.\s+/gm);
    if (listMatch && listMatch.length >= 2) {
      const listResult = renderNumberedList(textSegment, `seg-${segmentIndex}`);
      if (listResult) {
        return (
          <span key={segmentIndex}>
            {listResult.prefixText && <p className="mb-2">{parseInlineFormatting(listResult.prefixText, `seg-${segmentIndex}-pre`)}</p>}
            {listResult.list}
            {listResult.suffixText && <p className="mt-2">{parseInlineFormatting(listResult.suffixText, `seg-${segmentIndex}-suf`)}</p>}
          </span>
        );
      }
    }
    return <span key={segmentIndex}>{parseInlineFormatting(textSegment, `seg-${segmentIndex}`)}</span>;
  });
};

// ── Finding Accordion Item ──────────────────────────────────────────
const PublicFindingItem = ({ finding }: { finding: any }) => {
  const [open, setOpen] = useState(false);
  const sev = (finding.severity as Severity) || "info";
  const config = severityConfig[sev];
  const Icon = config.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full p-4 hover:bg-muted/30 transition-colors text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center justify-between sm:contents">
              <div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 min-w-[85px] justify-center", config.className)}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200 sm:hidden", open && "rotate-180")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2 sm:truncate">{finding.title}</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {finding.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono truncate max-w-[180px]">{finding.location}</span>
                </div>
              )}
              <div className="shrink-0">
                {finding.is_resolved ? (
                  <div className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="w-3.5 h-3.5" />Resolved</div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="w-3.5 h-3.5" />Open</div>
                )}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
            <div className="text-sm text-foreground/90 leading-relaxed text-justify">
              {renderWithCodeFormatting(finding.description)}
            </div>
          </div>

          {/* File */}
          {finding.location && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">File</h4>
              <div className="flex items-center gap-2 text-sm">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-primary truncate">{finding.location}</span>
                {finding.line_start && (
                  <span className="font-mono text-muted-foreground text-xs">
                    L{finding.line_start}{finding.line_end && finding.line_end !== finding.line_start ? `-${finding.line_end}` : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Code Snippet */}
          {finding.code_snippet && (
            <div className="overflow-x-auto">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Affected Code</h4>
              <CodeBlock
                code={finding.code_snippet}
                language="solidity"
                startLine={finding.line_start || 1}
                useHighlighting={true}
                highlightFn={highlightSolidityCode}
              />
            </div>
          )}

          {/* Remediation */}
          {finding.remediation && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-success" />
                Remediation Guide
              </h4>
              <div className="bg-success/5 border border-success/20 rounded-md p-4">
                <div className="text-sm text-foreground/90 leading-relaxed text-justify">
                  {renderWithCodeFormatting(finding.remediation)}
                </div>
              </div>
            </div>
          )}

          {/* Resolved Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {finding.is_resolved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">Resolved</span>
                {finding.resolved_at && (
                  <span className="text-xs text-muted-foreground ml-1">
                    on {format(new Date(finding.resolved_at), "MMM d, yyyy")}
                  </span>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Open</span>
              </>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ── Main Public Report Component ────────────────────────────────────
const PublicReport = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: audit, isLoading: auditLoading, error: auditError } = usePublicAudit(slug || null);
  const { data: findings } = usePublicFindings(audit?.id || null);
  const [scopeExpanded, setScopeExpanded] = useState(false);

  if (auditLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <ReportSkeleton />
        </div>
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

  // Compute severity counts
  const allFindings = findings || [];
  const severityCounts = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = allFindings.filter(f => f.severity === sev).length;
    return acc;
  }, {} as Record<Severity, number>);
  const totalFindings = allFindings.length;
  const resolvedCount = allFindings.filter(f => f.is_resolved).length;
  const resolvedPct = totalFindings > 0 ? Math.round((resolvedCount / totalFindings) * 100) : 0;

  const groupedFindings = SEVERITY_ORDER
    .filter(sev => severityCounts[sev] > 0)
    .map(sev => ({ severity: sev, findings: allFindings.filter(f => f.severity === sev) }));

  const grade = audit.grade as string | null;
  const gConfig = grade ? gradeConfig[grade] : null;

  // Scope files
  const scopeFiles: string[] = (() => {
    try {
      const sm = audit.scope_metadata;
      if (Array.isArray(sm)) return sm.map((f: any) => f.name || f.path || f).filter(Boolean);
      return [];
    } catch { return []; }
  })();
  const showScopeToggle = scopeFiles.length > 10;
  const visibleScopeFiles = scopeExpanded ? scopeFiles : scopeFiles.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ────────────────────────────────── */}
      <header className="border-b border-primary/20 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={solarLogo} alt="Solarizer" className="h-7 w-auto" />
            <div className="h-5 w-px bg-border" />
            <span className="terminal-pill">Security Audit Report</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary/70 border border-primary/20 rounded px-2.5 py-1">
            <Shield className="w-3.5 h-3.5" />
            Public Report
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">

        {/* ── Project Metadata Header ────────────────────── */}
        <div className="space-y-3">
          <span className="terminal-pill">Audit Report</span>
          <h1 className="heading-section font-bold text-gradient">{audit.project_name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(audit.created_at), "MMM d, yyyy")}</span>
            {audit.nloc_count && <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" />{audit.nloc_count.toLocaleString()} nLOC</span>}
            <span className="flex items-center gap-1.5"><Bug className="w-3.5 h-3.5" />{totalFindings} findings</span>
            <span className="flex items-center gap-1.5"><CircleCheckBig className="w-3.5 h-3.5" />{resolvedCount} resolved</span>
          </div>
        </div>

        {/* ── Score Card with Grade Ring ──────────────────── */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* Grade + Rating */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0",
              !grade ? "border-muted" :
              grade === "A" || grade === "B" ? "border-success" :
              grade === "C" || grade === "D" ? "border-warning" : "border-critical"
            )}>
              <span className={cn("text-xl font-bold", gConfig?.color || "text-muted-foreground")}>
                {grade || "--"}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-lg font-semibold", gConfig?.color || "text-muted-foreground")}>
                  {gConfig?.label || "Pending"}
                </span>
                <span className="text-sm text-muted-foreground">Security Rating</span>
              </div>
              <p className="text-xs text-muted-foreground">{gConfig?.description || "Analysis in progress"}</p>
            </div>
          </div>

          {/* Vulnerability Matrix Bar */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vulnerability Matrix</h4>
              <span className="text-xs text-muted-foreground">{totalFindings} findings</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
              {SEVERITY_ORDER.map(sev => {
                const width = totalFindings > 0 ? (severityCounts[sev] / totalFindings) * 100 : 0;
                return width > 0 ? (
                  <div key={sev} className={cn("h-full transition-all duration-500", severityConfig[sev].barColor)} style={{ width: `${width}%` }} />
                ) : null;
              })}
            </div>
            {/* Category Pills */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {SEVERITY_ORDER.map(sev => {
                const config = severityConfig[sev];
                const Icon = config.icon;
                return (
                  <div key={sev} className={cn("flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg border", config.className)}>
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-xs sm:text-sm font-medium">{severityCounts[sev]}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{config.label}</span>
                    <span className="text-[11px] text-muted-foreground sm:hidden">{config.label.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Remediation Progress Widget ─────────────────── */}
        {totalFindings > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <CircleCheckBig className="w-4 h-4 text-success" />
                Remediation Progress
              </h4>
              <span className="text-sm font-semibold text-foreground">{resolvedPct}%</span>
            </div>
            <Progress value={resolvedPct} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {resolvedCount} of {totalFindings} findings resolved
            </p>
          </div>
        )}

        {/* ── Scope Section ──────────────────────────────── */}
        {scopeFiles.length > 0 && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Audit Scope
              </h3>
              <span className="text-xs text-muted-foreground font-mono">{scopeFiles.length} files</span>
            </div>
            <div className="divide-y divide-border/50">
              {visibleScopeFiles.map((file, i) => (
                <div key={i} className={cn("px-5 py-2 text-sm font-mono text-muted-foreground", i % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                  {file}
                </div>
              ))}
            </div>
            {showScopeToggle && (
              <button
                onClick={() => setScopeExpanded(!scopeExpanded)}
                className="w-full py-2.5 text-xs text-primary hover:text-primary/80 transition-colors border-t border-border"
              >
                {scopeExpanded ? "Show less" : `Show all ${scopeFiles.length} files`}
              </button>
            )}
          </div>
        )}

        {/* ── Findings by Severity ────────────────────────── */}
        {groupedFindings.map(({ severity, findings: groupFindings }) => {
          const config = severityConfig[severity];
          const Icon = config.icon;
          return (
            <div key={severity} className="space-y-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border", config.className)}>
                  <Icon className="w-4 h-4" />
                  {config.label}
                </div>
                <span className="text-muted-foreground text-sm font-normal">({groupFindings.length})</span>
              </h2>
              <div className="space-y-2">
                {groupFindings.map(finding => (
                  <div key={finding.id} className={cn(
                    "border border-border rounded-lg overflow-hidden bg-card/50 border-l-2",
                    severity === "critical" ? "border-l-critical" :
                    severity === "high" ? "border-l-destructive" :
                    severity === "medium" ? "border-l-warning" :
                    severity === "low" ? "border-l-low" :
                    severity === "info" ? "border-l-slate-400" : "border-l-green-500"
                  )}>
                    <PublicFindingItem finding={finding} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* No findings */}
        {totalFindings === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <ShieldCheck className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No Vulnerabilities Found</p>
            <p className="text-sm text-muted-foreground mt-1">This project passed security analysis with no issues.</p>
          </div>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border mt-12 relative overflow-hidden">
        <div className="bg-radial-glow absolute inset-0 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 py-10 text-center space-y-3 relative">
          <div className="flex items-center justify-center gap-2">
            <img src={solarLogo} alt="Solarizer" className="h-5 w-auto opacity-50" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Powered by Solarizer</p>
          <p className="text-xs text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
            This report was generated by Solarizer, an AI-powered smart contract security analysis engine by Eryonix Techlabs.
            This is an automated analysis and should be reviewed by security professionals before making critical decisions.
          </p>
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} Eryonix Techlabs · solarizer.eryonix.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicReport;
