import { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { AuditOrchestrationProgress } from "@/hooks/useAuditProgress";

const PHASES = [
  { key: "complexity_estimation", label: "Complexity Analysis" },
  { key: "session_start", label: "Session Start" },
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

const AuditProgressPanel = ({ orchestration, scopeMetadata }: AuditProgressPanelProps) => {
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
      if (secondsSince >= 300) setStaleness('stuck');
      else if (secondsSince >= 90) setStaleness('warn');
      else setStaleness('fresh');
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  const activePhaseIdx = getPhaseIndex(orchestration.phase);
  const contractTotal = orchestration.progress.contractTotal || scopeMetadata?.length || 0;
  const hideCC = contractTotal <= 1;

  const scopeMap = useMemo(() => {
    const map = new Map<string, ScopeMetaItem>();
    (scopeMetadata || []).forEach((s) => map.set(s.path, s));
    return map;
  }, [scopeMetadata]);

  const contractProgress = orchestration.progress.contractProgress || {};
  const contractList = useMemo(() => {
    const paths = scopeMetadata?.map((s) => s.path) || Object.keys(contractProgress);
    return paths.map((path) => {
      const meta = scopeMap.get(path);
      const prog = contractProgress[path];
      const isActive = orchestration.progress.currentContract === path && !prog?.done;
      return { path, meta, done: prog?.done || false, error: prog?.error, isActive };
    });
  }, [scopeMetadata, contractProgress, orchestration.progress.currentContract, scopeMap]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Audit in Progress
          </CardTitle>
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
            const isCompleted = activePhaseIdx > idx;
            const isActive = activePhaseIdx === idx;
            const isPending = activePhaseIdx < idx;

            let suffix = "";
            if (isActive && (phase.key === "hunting" || phase.key === "qa")) {
              const ci = orchestration.progress.contractIndex ?? 0;
              suffix = ` (${ci}/${contractTotal})`;
            }
            if (isActive && phase.key === "cross_contract") {
              const cp = orchestration.progress.crossContractPass ?? 0;
              const ct = orchestration.progress.crossContractTotal ?? 0;
              if (ct > 0) suffix = ` (${cp}/${ct})`;
            }

            return (
              <div key={phase.key} className="flex items-center gap-2 py-0.5">
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                {isPending && <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                <span className={cn(
                  "text-sm",
                  isCompleted && "text-success",
                  isActive && "text-primary font-medium",
                  isPending && "text-muted-foreground"
                )}>
                  {phase.label}{suffix}
                </span>
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

              return (
                <div key={c.path} className="space-y-1">
                  <div className="flex items-center gap-2 py-0.5">
                    {c.done && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                    {c.isActive && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                    {c.error && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                    {!c.done && !c.isActive && !c.error && <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                    <span className={cn(
                      "text-sm truncate",
                      c.done && "text-success",
                      c.isActive && "text-primary font-medium",
                      !c.done && !c.isActive && "text-muted-foreground"
                    )}>
                      {filename}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                      {complexity}
                    </Badge>
                    {!c.done && !c.isActive && !c.error && (
                      <span className="text-xs text-muted-foreground/50">pending</span>
                    )}
                  </div>
                  {c.isActive && (
                    <div className="ml-6 space-y-0.5">
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

        {/* Findings count */}
        {(orchestration.findings_count || 0) > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Findings ({orchestration.findings_count})
            </h4>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditProgressPanel;
