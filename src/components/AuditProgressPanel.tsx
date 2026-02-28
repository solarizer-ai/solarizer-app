import { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { AuditOrchestrationProgress } from "@/hooks/useAuditProgress";

const PHASES = [
  { key: "preparing", label: "Preparing" },
  { key: "hunting", label: "Hunting" },
  { key: "cross_contract", label: "Cross-Contract" },
  { key: "validation", label: "Validation" },
  { key: "qa", label: "QA Scan" },
  { key: "formatting", label: "Formatting" },
  { key: "reporting", label: "Report Generation" },
] as const;

export const PHASE_LABELS: Record<string, string> = Object.fromEntries(
  PHASES.map((p) => [p.key, p.label])
);

interface ScopeMetaItem {
  path: string;
  nLOC: number;
  complexity: "L1" | "L2" | "L3";
}

interface AuditProgressPanelProps {
  orchestration: AuditOrchestrationProgress;
  scopeMetadata?: ScopeMetaItem[] | null;
  liveFindings?: { severity: string }[];
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getPhaseIndex(phase: string): number {
  return PHASES.findIndex((p) => p.key === phase);
}

const SUB_PHASES_BY_COMPLEXITY: Record<string, string[]> = {
  L1: ["DNA Matching", "Initial Scan"],
  L2: ["DNA Matching", "Initial Scan", "Deep Scan"],
  L3: ["DNA Matching", "Initial Scan", "Deep Scan"],
};

const ComplexityPill = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    L1: 'bg-muted text-muted-foreground ring-1 ring-border',
    L2: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30',
    L3: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[level] || styles.L1}`}>
      {level}
    </span>
  );
};

const AuditProgressPanel = ({ orchestration, scopeMetadata, liveFindings = [] }: AuditProgressPanelProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [staleness, setStaleness] = useState<'fresh' | 'warn' | 'stuck'>('fresh');
  const lastUpdatedRef = useRef<string>(orchestration.updated_at);

  useEffect(() => {
    const start = new Date(orchestration.started_at).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [orchestration.started_at]);

  useEffect(() => {
    lastUpdatedRef.current = orchestration.updated_at;
    setStaleness('fresh');
  }, [orchestration.updated_at]);

  useEffect(() => {
    const check = () => {
      const secondsSince = Math.floor((Date.now() - new Date(lastUpdatedRef.current).getTime()) / 1000);
      if (secondsSince >= 3600) setStaleness('stuck');
      else if (secondsSince >= 1800) setStaleness('warn');
      else setStaleness('fresh');
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  // Map backend phase to our display phases. If no backend phase matches
  // (e.g. "queued" or empty), we're still preparing (index 0).
  const rawPhaseIdx = getPhaseIndex(orchestration.phase);
  const activePhaseIdx = rawPhaseIdx >= 0 ? rawPhaseIdx : 0;
  const contractTotal = orchestration.progress.contractTotal || scopeMetadata?.length || 0;
  const hideCC = contractTotal <= 1;

  const skippedPhases = useMemo(() => new Set(orchestration.progress.skippedPhases ?? []), [orchestration.progress.skippedPhases]);
  const isSkipped = (key: string) => skippedPhases.has(key);

  const scopeMap = useMemo(() => {
    const map = new Map<string, ScopeMetaItem>();
    (scopeMetadata || []).forEach((s) => map.set(s.path, s));
    return map;
  }, [scopeMetadata]);

  const contractProgress = orchestration.progress.contractProgress || {};
  const contractList = useMemo(() => {
    const paths = scopeMetadata?.map((s) => s.path) || Object.keys(contractProgress);
    const currentIdx = orchestration.progress.contractIndex ?? 0;
    const currentContractPath = orchestration.progress.currentContract;
    const derivedIdx = currentContractPath
      ? paths.findIndex((p) => p === currentContractPath)
      : -1;
    const effectiveIdx = derivedIdx >= 0 ? derivedIdx : currentIdx;
    return paths.map((path, idx) => {
      const meta = scopeMap.get(path);
      const prog = contractProgress[path];
      const done = prog?.done || idx < effectiveIdx || activePhaseIdx > 1;
      const isActive = orchestration.progress.currentContract === path && !done;
      return { path, meta, done, error: prog?.error, isActive };
    });
  }, [scopeMetadata, contractProgress, orchestration.progress.currentContract, orchestration.progress.contractIndex, activePhaseIdx, scopeMap]);

  const scopeSummary = useMemo(() => {
    if (!scopeMetadata || scopeMetadata.length === 0) return null;
    const totalNloc = scopeMetadata.reduce((sum, s) => sum + s.nLOC, 0);
    return `${scopeMetadata.length} contract${scopeMetadata.length !== 1 ? 's' : ''} · ${totalNloc.toLocaleString()} nLOC`;
  }, [scopeMetadata]);

  const isHuntingOrQa = orchestration.phase === 'hunting' || orchestration.phase === 'qa';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Audit in Progress
            </CardTitle>
            {scopeSummary && (
              <p className="text-xs text-muted-foreground">{scopeSummary}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-mono text-muted-foreground">{formatElapsed(elapsed)}</span>
            {staleness === 'warn' && (
              <span className="text-xs text-warning">
                Last updated {formatDistanceToNow(new Date(orchestration.updated_at), { addSuffix: true })}
              </span>
            )}
            {staleness === 'stuck' && (
              <span className="text-xs text-destructive font-medium">
                Progress hasn't updated — the audit may be stuck.
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phases */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Phases</h4>
          {PHASES.map((phase, idx) => {
            if (phase.key === "cross_contract" && hideCC) return null;

            const isLocked = isSkipped(phase.key);

            // "preparing" is a virtual phase: active when backend hasn't reached hunting yet, done once it has
            const isPreparing = phase.key === "preparing";
            const isCompleted = isPreparing
              ? !isLocked && rawPhaseIdx >= 0
              : !isLocked && activePhaseIdx > idx;
            const isActive = isPreparing
              ? !isLocked && rawPhaseIdx < 0
              : !isLocked && activePhaseIdx === idx;
            const isPending = !isPreparing && !isLocked && activePhaseIdx < idx;

            let suffix = "";
            if (isActive && (phase.key === "hunting" || phase.key === "qa")) {
              const ci = (orchestration.progress.contractIndex ?? 0) + 1;
              suffix = ` (${ci}/${contractTotal})`;
            }
            if (isActive && phase.key === "cross_contract") {
              const cp = orchestration.progress.crossContractPass ?? 0;
              const ct = orchestration.progress.crossContractTotal ?? 0;
              if (ct > 0) suffix = ` (${cp}/${ct})`;
            }

            return (
              <div key={phase.key} className={cn(
                "flex items-center gap-2 py-1 px-2 -mx-2 rounded",
                isActive && "bg-primary/5"
              )}>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                {isPending && <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                {isLocked && <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                <div className="flex flex-col">
                  <span className={cn(
                    "text-sm",
                    isCompleted && "text-success",
                    isActive && "text-primary font-medium",
                    isPending && "text-muted-foreground",
                    isLocked && "text-muted-foreground/50"
                  )}>
                    {phase.label}{suffix}
                  </span>
                  {isLocked && (
                    <span className="text-[10px] text-muted-foreground/40">
                      Not included on this plan
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contracts */}
        {contractList.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Contracts</h4>
            {contractList.map((c) => {
              const filename = c.path.split("/").pop() || c.path;
              const complexity = c.meta?.complexity || "L1";
              const subPhases = SUB_PHASES_BY_COMPLEXITY[complexity] || SUB_PHASES_BY_COMPLEXITY.L1;
              const currentSubPhase = orchestration.progress.subPhase;

              // Mutually exclusive icon: error > done > active > pending
              let icon: React.ReactNode;
              let textClass: string;
              if (c.error) {
                icon = <AlertCircle className="w-4 h-4 text-destructive shrink-0" />;
                textClass = "text-destructive";
              } else if (c.done) {
                icon = <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
                textClass = "text-success";
              } else if (c.isActive) {
                icon = <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />;
                textClass = "text-primary font-medium";
              } else {
                icon = <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />;
                textClass = "text-muted-foreground";
              }

              return (
                <div key={c.path} className="space-y-1">
                  <div className="flex items-center gap-2 py-0.5">
                    {icon}
                    <span className={cn("text-sm truncate", textClass)}>
                      {filename}
                    </span>
                    <ComplexityPill level={complexity} />
                    {!c.done && !c.isActive && !c.error && (
                      <span className="text-xs text-muted-foreground/50">pending</span>
                    )}
                  </div>
                  {c.isActive && isHuntingOrQa && (
                    <div className="ml-6 pl-3 border-l-2 border-border/40 space-y-0.5">
                      {subPhases.map((sp) => {
                        const spKey = sp.toLowerCase().replace(/\s+/g, "_");
                        const currentKey = (currentSubPhase || "").toLowerCase().replace(/\s+/g, "_");
                        const spIdx = subPhases.indexOf(sp);
                        const activeIdx = subPhases.findIndex(
                          (s) => s.toLowerCase().replace(/\s+/g, "_") === currentKey
                        );
                        const isDone = activeIdx > spIdx;
                        const isCurrent = spKey === currentKey;

                        return (
                          <div key={sp} className="flex items-center gap-2">
                            {isDone && <CheckCircle2 className="w-3 h-3 text-success shrink-0" />}
                            {isCurrent && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                            {!isDone && !isCurrent && <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                            <span className={cn(
                              "text-xs",
                              isDone && "text-success",
                              isCurrent && "text-primary",
                              !isDone && !isCurrent && "text-muted-foreground"
                            )}>
                              {sp}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Findings */}
        {(orchestration.findings_count || 0) > 0 && (() => {
          const severityOrder = ['critical', 'high', 'medium', 'low', 'info', 'gas'] as const;
          const severityStyles: Record<string, string> = {
            critical: 'bg-red-500/10 text-red-400 border-red-500/20',
            high:     'bg-destructive/10 text-destructive border-destructive/20',
            medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
            low:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
            info:     'bg-slate-400/10 text-slate-400 border-slate-400/20',
            gas:      'bg-green-500/10 text-green-500 border-green-500/20',
          };

          const counts: Record<string, number> = {};
          if (liveFindings.length > 0) {
            for (const f of liveFindings) {
              counts[f.severity] = (counts[f.severity] || 0) + 1;
            }
          }

          const hasSeverityBreakdown = liveFindings.length > 0;

          return (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Findings ({orchestration.findings_count})
              </h4>
              {hasSeverityBreakdown ? (
                <div className="flex flex-wrap gap-1.5">
                  {severityOrder
                    .filter((sev) => (counts[sev] || 0) > 0)
                    .map((sev) => (
                      <span key={sev} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${severityStyles[sev]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {sev} {counts[sev]}
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Loading breakdown...</p>
              )}
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default AuditProgressPanel;
