import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicAudit, usePublicFindings } from "@/hooks/usePublicAudit";
import CodeBlock from "@/components/CodeBlock";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvariantsTab from "@/components/InvariantsTab";
import InsightsTab from "@/components/InsightsTab";
import SecurityCoverageTab from "@/components/SecurityCoverageTab";
import { cn } from "@/lib/utils";
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle,
  Info, Fuel, ChevronDown, FileCode, Lightbulb,
  Calendar, Code2, Bug,
  Clock, Scale, Cpu, RefreshCcw, Eye, ExternalLink,
} from "lucide-react";
import type { Invariant, ArchitectureInsight, CoverageData } from "@/hooks/useAudits";
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
    // Split on double newlines into paragraphs for structured rendering
    const paragraphs = textSegment.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length <= 1) {
      return <span key={segmentIndex}>{parseInlineFormatting(textSegment, `seg-${segmentIndex}`)}</span>;
    }
    return (
      <div key={segmentIndex} className="space-y-3">
        {paragraphs.map((para, pIdx) => {
          const labelMatch = para.match(/^([A-Z][A-Za-z\s]+):\s*/);
          if (labelMatch) {
            const label = labelMatch[1];
            const rest = para.slice(labelMatch[0].length);
            return (
              <p key={pIdx}>
                <strong className="font-semibold text-foreground">{label}:</strong>{' '}
                {parseInlineFormatting(rest, `seg-${segmentIndex}-p-${pIdx}`)}
              </p>
            );
          }
          return <p key={pIdx}>{parseInlineFormatting(para.trim(), `seg-${segmentIndex}-p-${pIdx}`)}</p>;
        })}
      </div>
    );
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
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-border p-5 space-y-5 bg-muted/10">
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

        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ── Branded Header (shared across loading/error/main) ───────────────
const BrandedHeader = () => (
  <>
    <header className="border-b border-primary/20 bg-background/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={solarLogo} alt="Solarizer" className="h-7 w-auto" />
          <div className="h-5 w-px bg-border" />
          <span className="terminal-pill">Security Audit Report</span>
        </div>
        <Button asChild variant="solarGlow" size="sm">
          <Link to="/login">Start Auditing</Link>
        </Button>
      </div>
    </header>
    <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
  </>
);

// ── Main Public Report Component ────────────────────────────────────
const PublicReport = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: audit, isLoading: auditLoading, error: auditError } = usePublicAudit(slug || null);
  const { data: findings } = usePublicFindings(audit?.id || null);
  const [scopeExpanded, setScopeExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("findings");

  // ── Loading State ──────────────────────────────────
  if (auditLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandedHeader />
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">
          {/* Hero skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-9 w-72" />
            <div className="flex gap-3">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
          {/* Executive Summary skeleton */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Findings skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────
  if (auditError || !audit) {
    return (
      <div className="min-h-screen bg-background">
        <BrandedHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center space-y-4 px-6">
            <div className="w-16 h-16 rounded-full border-2 border-muted flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Report Not Found</h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              This report may have been made private, the link may be invalid,
              or the audit may still be in progress.
            </p>
            <a
              href="https://solarizer.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Visit Solarizer
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
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
  const groupedFindings = SEVERITY_ORDER
    .filter(sev => severityCounts[sev] > 0)
    .map(sev => ({ severity: sev, findings: allFindings.filter(f => f.severity === sev) }));

  const grade = audit.grade as string | null;
  const gConfig = grade ? gradeConfig[grade] : null;

  // Scope files (in-scope = analysed for vulnerabilities, context = reference only)
  const scopeFiles: string[] = (() => {
    try {
      const sm = audit.scope_metadata;
      if (Array.isArray(sm)) return sm.map((f: any) => f.name || f.path || f).filter(Boolean);
      return [];
    } catch { return []; }
  })();
  const contextFiles: string[] = (() => {
    try {
      const cm = (audit as any).context_metadata;
      if (Array.isArray(cm)) return cm.map((f: any) => f.name || f.path || f).filter(Boolean);
      return [];
    } catch { return []; }
  })();
  const allScopeFiles = [
    ...scopeFiles.map(f => ({ path: f, inScope: true })),
    ...contextFiles.map(f => ({ path: f, inScope: false })),
  ];
  const showScopeToggle = allScopeFiles.length > 10;
  const visibleScopeFiles = scopeExpanded ? allScopeFiles : allScopeFiles.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky Header ────────────────────────────────── */}
      <BrandedHeader />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl space-y-8">

        {/* ── Hero: Project Metadata ─────────────────────── */}
        <div className="space-y-4">
          <h1 className="heading-section font-bold text-gradient">{audit.project_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-full px-3 py-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(audit.created_at), "MMM d, yyyy")}
            </span>
            {audit.nloc_count && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-full px-3 py-1.5">
                <Code2 className="w-3.5 h-3.5" />
                {audit.nloc_count.toLocaleString()} nLOC
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-full px-3 py-1.5">
              <Bug className="w-3.5 h-3.5" />
              {totalFindings} {totalFindings === 1 ? "finding" : "findings"}
            </span>
          </div>
        </div>

        {/* ── Executive Summary (Grade + Remediation + Vuln Matrix) ── */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Card header bar */}
          <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Executive Summary</h3>
          </div>

          <div className="p-6 space-y-5">
            {/* Top row: Grade + Remediation */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Grade Ring */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-20 h-20 rounded-full border-[3px] flex items-center justify-center shrink-0",
                  !grade ? "border-muted" :
                  grade === "A" || grade === "B" ? "border-success" :
                  grade === "C" || grade === "D" ? "border-warning" : "border-critical"
                )}>
                  <span className={cn("text-3xl font-bold", gConfig?.color || "text-muted-foreground")}>
                    {grade || "--"}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-lg font-semibold", gConfig?.color || "text-muted-foreground")}>
                    {gConfig?.label || "Pending"}
                  </span>
                  <span className="text-sm text-muted-foreground">· {totalFindings} findings</span>
                </div>
              </div>

            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Vulnerability Distribution */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Vulnerability Matrix</h4>
              <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
                {SEVERITY_ORDER.map(sev => {
                  const width = totalFindings > 0 ? (severityCounts[sev] / totalFindings) * 100 : 0;
                  return width > 0 ? (
                    <div key={sev} className={cn("h-full transition-all duration-500", severityConfig[sev].barColor)} style={{ width: `${width}%` }} />
                  ) : null;
                })}
              </div>
              {/* Severity Labels */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {SEVERITY_ORDER.map(sev => {
                  const config = severityConfig[sev];
                  const textColor = config.className.split(" ")[0];
                  return (
                    <span key={sev} className={cn("text-xs sm:text-sm font-medium", textColor)}>
                      {config.label} {severityCounts[sev]}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabbed Content ─────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-11">
            <TabsTrigger value="findings" className="gap-1.5 text-xs sm:text-sm">
              <Bug className="w-3.5 h-3.5 hidden sm:block" />
              Findings
            </TabsTrigger>
            <TabsTrigger value="invariants" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="w-3.5 h-3.5 hidden sm:block" />
              Invariants
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm">
              <Lightbulb className="w-3.5 h-3.5 hidden sm:block" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="coverage" className="gap-1.5 text-xs sm:text-sm">
              <ShieldCheck className="w-3.5 h-3.5 hidden sm:block" />
              Coverage
            </TabsTrigger>
            <TabsTrigger value="scope" className="gap-1.5 text-xs sm:text-sm">
              <FileCode className="w-3.5 h-3.5 hidden sm:block" />
              Scope
            </TabsTrigger>
          </TabsList>

          {/* Findings Tab */}
          <TabsContent value="findings" className="mt-6">
            {groupedFindings.length > 0 ? (
              <div className="space-y-4">
                {groupedFindings.flatMap(({ severity, findings: groupFindings }) =>
                  groupFindings.map(finding => (
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
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-card border border-border rounded-lg relative overflow-hidden">
                <div className="bg-radial-glow absolute inset-0 pointer-events-none" />
                <div className="relative">
                  <ShieldCheck className="w-16 h-16 text-success mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No Vulnerabilities Detected</p>
                  <p className="text-sm text-muted-foreground mt-1">No issues were identified during automated analysis.</p>
                  <p className="text-xs text-muted-foreground/60 mt-3 max-w-md mx-auto">
                    This does not guarantee the absence of vulnerabilities — see the disclaimer below.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Invariants Tab */}
          <TabsContent value="invariants" className="mt-6">
            <InvariantsTab invariants={((audit.system_hologram as any)?.invariants as Invariant[]) || null} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <InsightsTab insights={((audit.system_hologram as any)?.insights as ArchitectureInsight[]) || null} />
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="mt-6">
            <SecurityCoverageTab coverageData={(audit.coverage_data as unknown as CoverageData) || null} onViewIssue={() => {}} />
          </TabsContent>

          {/* Scope Tab */}
          <TabsContent value="scope" className="mt-6">
            {allScopeFiles.length > 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                  <h3 className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audit Scope</span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{scopeFiles.length} in scope</span>
                    {contextFiles.length > 0 && <span>{contextFiles.length} context</span>}
                  </div>
                </div>
                {contextFiles.length > 0 && (
                  <div className="px-5 py-2.5 bg-muted/10 border-b border-border/50">
                    <p className="text-xs text-muted-foreground/70">
                      Findings are reported only for <strong className="text-foreground/80">in-scope</strong> contracts. Context files are included for reference during cross-contract analysis but are not directly audited.
                    </p>
                  </div>
                )}
                <div className="divide-y divide-border/50">
                  {visibleScopeFiles.map((file, i) => (
                    <div key={i} className={cn("px-5 py-2 text-sm font-mono text-muted-foreground flex items-center gap-2", i % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
                      <span className="flex-1 truncate">{file.path}</span>
                      {file.inScope ? (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 shrink-0">In Scope</span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground/50 bg-muted/50 border border-border rounded px-1.5 py-0.5 shrink-0">Context</span>
                      )}
                    </div>
                  ))}
                </div>
                {showScopeToggle && (
                  <button
                    onClick={() => setScopeExpanded(!scopeExpanded)}
                    className="w-full py-2.5 text-xs text-primary hover:text-primary/80 transition-colors border-t border-border flex items-center justify-center gap-1"
                  >
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", scopeExpanded && "rotate-180")} />
                    {scopeExpanded ? "Show less" : `Show all ${allScopeFiles.length} files`}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileCode className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No scope information available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Disclaimer & Limitations ───────────────────── */}
        <div className="border border-amber-500/20 bg-amber-500/[0.03] rounded-lg overflow-hidden">
          <div className="px-5 py-3 bg-amber-500/[0.05] border-b border-amber-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-medium text-amber-500/90 uppercase tracking-wider">Important Disclaimer & Limitations</h3>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-sm text-foreground/80 leading-relaxed">
              This report was generated by Solarizer, an AI-powered smart contract security analysis engine
              by Solarizer. It is provided for informational purposes only and is subject to the
              following important limitations:
            </p>

            <div className="grid gap-5">
              {/* 1. No Security Guarantee */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <ShieldAlert className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">No Security Guarantee</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No automated analysis can guarantee 100% security. This report identifies potential
                    vulnerabilities within the scope of the contracts analyzed but may not detect all possible
                    issues, including novel attack vectors, economic exploits, or vulnerabilities arising from
                    deployment configuration or off-chain components. The absence of findings does not imply the
                    absence of vulnerabilities.
                  </p>
                </div>
              </div>

              {/* 2. AI-Powered Automated Analysis */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <Cpu className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">AI-Powered Automated Analysis</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This report was produced using a multi-model AI engine, not a manual human audit.
                    While the engine employs multiple specialized models for vulnerability hunting, validation,
                    and quality assurance, critical protocols should still undergo independent manual review
                    by qualified security professionals.
                  </p>
                </div>
              </div>

              {/* 3. Point-in-Time Assessment */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <Clock className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Point-in-Time Assessment</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Findings reflect the state of the code at the time of analysis. Any subsequent
                    modifications to the contracts may introduce new vulnerabilities not covered by this report.
                    Re-auditing is recommended after significant code changes.
                  </p>
                </div>
              </div>

              {/* 4. Scope-Limited Coverage */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <Eye className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Scope-Limited Coverage</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only the files listed in the Audit Scope section above were analyzed. This report does not
                    cover deployment configurations, operational procedures, frontend code, oracle
                    dependencies, or external contract interactions beyond the defined scope.
                  </p>
                </div>
              </div>

              {/* 5. Not Financial or Legal Advice */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <Scale className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Not Financial or Legal Advice</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This report does not constitute an endorsement of the analyzed project or any associated
                    tokens. It is not investment advice, financial advice, or legal advice. Deployment
                    decisions remain the sole responsibility of the contract developers and deployers.
                  </p>
                </div>
              </div>

              {/* 6. Ongoing Security Recommended */}
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  <RefreshCcw className="w-[18px] h-[18px] text-amber-500/70" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Ongoing Security Recommended</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Security is an ongoing process, not a one-time event. Bug bounty programs, periodic
                    re-audits, real-time monitoring, and responsible disclosure policies are strongly
                    recommended alongside any audit report.
                  </p>
                </div>
              </div>
            </div>

            {/* Liability footnote */}
            <div className="pt-4 border-t border-amber-500/10">
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Solarizer expressly disclaims liability for any losses, damages, or exploits arising from
                the use or deployment of analyzed contracts. For the full terms governing the use of this
                report, see our{" "}
                <a
                  href="https://solarizer.io/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/70 hover:text-primary underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border mt-16 relative overflow-hidden">
        <div className="bg-radial-glow absolute inset-0 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl relative">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <img src={solarLogo} alt="Solarizer" className="h-5 w-auto opacity-60" />
              <span className="text-sm font-medium text-muted-foreground">Solarizer</span>
            </div>

            {/* Condensed disclaimer */}
            <p className="text-xs text-muted-foreground/70 max-w-lg leading-relaxed">
              This report was generated by Solarizer, an AI-powered smart contract security analysis engine.
              It is an automated analysis and does not constitute a formal security audit, legal advice, or a
              guarantee of security. See the full disclaimer above.
            </p>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/50">
              <span>&copy; {new Date().getFullYear()} Solarizer</span>
              <span className="hidden sm:inline">&middot;</span>
              <a
                href="https://solarizer.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors"
              >
                solarizer.io
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="hidden sm:inline">&middot;</span>
              <a
                href="https://solarizer.io/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                Terms
              </a>
              <span className="hidden sm:inline">&middot;</span>
              <a
                href="https://solarizer.io/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicReport;
