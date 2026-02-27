import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Circle, AlertTriangle, AlertCircle, Info, FileCode, Shield, Lightbulb, ShieldCheck, Archive, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

interface DemoFinding {
  severity: "critical" | "high" | "medium";
  title: string;
  location: string;
  lines: string;
  snippet: string;
  startLine: number;
}

interface FrameState {
  phaseIdx: number;           // 0-5 (6 phases), 6 = all done
  findingsCount: number;
  score: number;
  grade: string;
  gradeColor: string;
  elapsed: number;
  contractIdx: number;
  subPhaseIdx: number;
  complete?: boolean;
  counts: { critical: number; high: number; medium: number; low: number; info: number; gas: number };
}

// ─── Static data ──────────────────────────────────────────────────────────

const PHASES = [
  "Hunting",
  "Cross-Contract",
  "Validation",
  "QA Scan",
  "Formatting",
  "Report Generation",
] as const;

const CONTRACTS = [
  { name: "Vault.sol", complexity: "L2" as const },
  { name: "LendingCore.sol", complexity: "L3" as const },
  { name: "PriceOracle.sol", complexity: "L1" as const },
  { name: "RewardVault.sol", complexity: "L2" as const },
];

const SUB_PHASES = ["DNA Matching", "Initial Scan", "Deep Scan"];

const FINDINGS: DemoFinding[] = [
  {
    severity: "critical",
    title: "Read-only reentrancy via getPricePerShare()",
    location: "Vault.sol",
    lines: "334-341",
    startLine: 334,
    snippet: `function getPricePerShare() public view returns (uint256) {
    return totalAssets() / totalSupply();
    // @audit stale mid-callback value
}`,
  },
  {
    severity: "high",
    title: "Fee-on-transfer insolvency in deposit()",
    location: "LendingCore.sol",
    lines: "89-96",
    startLine: 89,
    snippet: `function deposit(uint256 amount) external {
    token.transferFrom(msg.sender, address(this), amount);
    balances[msg.sender] += amount; // @audit actual != amount
}`,
  },
  {
    severity: "high",
    title: "Liquidation bypass via callback ordering",
    location: "LendingCore.sol",
    lines: "167-174",
    startLine: 167,
    snippet: `function liquidate(address user) external {
    _repay(user);  // external call
    require(getCollateralRatio(user) < threshold);
    // @audit check after interaction
}`,
  },
  {
    severity: "medium",
    title: "TWAP window insufficient for thin markets",
    location: "PriceOracle.sol",
    lines: "211-218",
    startLine: 211,
    snippet: `uint256 twapPrice = _getTWAP(15 minutes);
// @audit single-block manipulation on low liq`,
  },
];

// Remapped: 0=Hunting, 1=Cross-Contract, 2=Validation, 3=QA, 4=Formatting, 5=Report Generation, 6=all done
const FRAMES: FrameState[] = [
  { phaseIdx: 0, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 0, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 9, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 1, score: 28, grade: "C+", gradeColor: "text-warning", elapsed: 51, contractIdx: 0, subPhaseIdx: 1, counts: { critical: 1, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 2, score: 44, grade: "C+", gradeColor: "text-warning", elapsed: 86, contractIdx: 1, subPhaseIdx: 0, counts: { critical: 1, high: 1, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 3, score: 61, grade: "B", gradeColor: "text-success", elapsed: 118, contractIdx: 1, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 1, findingsCount: 4, score: 67, grade: "B", gradeColor: "text-success", elapsed: 149, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 2, findingsCount: 4, score: 71, grade: "B", gradeColor: "text-success", elapsed: 163, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 5, findingsCount: 4, score: 74, grade: "B+", gradeColor: "text-success", elapsed: 180, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 6, findingsCount: 4, score: 74, grade: "B+", gradeColor: "text-success", elapsed: 194, contractIdx: 3, subPhaseIdx: 2, complete: true, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0, gas: 0 } },
];

const FRAME_DELAYS = [1600, 2000, 1800, 1800, 2000, 1800, 2000, 2400, 5000];

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, label: "Critical", className: "text-critical bg-critical/10 border-critical/20" },
  high:     { icon: AlertTriangle, label: "High",     className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium:   { icon: AlertCircle,  label: "Medium",   className: "text-warning bg-warning/10 border-warning/20" },
} as const;

const VULN_CATEGORIES = [
  { label: "Critical", key: "critical" as const, icon: AlertTriangle, barColor: "bg-critical",    bgColor: "bg-critical/10",    textColor: "text-critical",    borderColor: "border-critical/30" },
  { label: "High",     key: "high" as const,     icon: AlertTriangle, barColor: "bg-destructive", bgColor: "bg-destructive/10", textColor: "text-destructive", borderColor: "border-destructive/30" },
  { label: "Medium",   key: "medium" as const,   icon: AlertCircle,  barColor: "bg-warning",     bgColor: "bg-warning/10",     textColor: "text-warning",     borderColor: "border-warning/30" },
  { label: "Low",      key: "low" as const,      icon: Info,         barColor: "bg-low",         bgColor: "bg-low/10",         textColor: "text-low",         borderColor: "border-low/30" },
  { label: "Info",     key: "info" as const,      icon: Info,         barColor: "bg-slate-400",   bgColor: "bg-slate-400/10",   textColor: "text-slate-400",   borderColor: "border-slate-400/30" },
  { label: "Gas",      key: "gas" as const,       icon: Fuel,         barColor: "bg-green-500",   bgColor: "bg-green-500/10",   textColor: "text-green-500",   borderColor: "border-green-500/30" },
];

const GRADE_LABELS: Record<string, string> = {
  "A": "Excellent", "B+": "Good", "B": "Good",
  "C+": "Fair", "C": "Fair", "D": "Poor", "F": "Critical", "—": "Pending",
};

const GRADE_DESCRIPTIONS: Record<string, string> = {
  "A": "No critical vulnerabilities detected",
  "B+": "Minor issues that should be addressed",
  "B": "Minor issues that should be addressed",
  "C+": "Several issues requiring attention",
  "C": "Several issues requiring attention",
  "D": "Significant vulnerabilities detected",
  "F": "Critical security flaws present",
  "—": "Analysis in progress or no results yet",
};

const COMPLEXITY_STYLES: Record<string, string> = {
  L1: "bg-muted text-muted-foreground ring-1 ring-border",
  L2: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30",
  L3: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────

const DashboardAuditDemo = () => {
  const [frameIdx, setFrameIdx] = useState(0);
  const [tickOffset, setTickOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const delay = FRAME_DELAYS[frameIdx] ?? 2000;
    timerRef.current = setTimeout(() => {
      setFrameIdx(f => (f >= FRAMES.length - 1 ? 0 : f + 1));
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [frameIdx]);

  useEffect(() => { setTickOffset(0); }, [frameIdx]);

  useEffect(() => {
    if (FRAMES[frameIdx]?.complete) return;
    const iv = setInterval(() => setTickOffset(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [frameIdx]);

  const state = FRAMES[frameIdx];
  const elapsed = state.elapsed + tickOffset;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs < 10 ? "0" : ""}${secs}s` : `${secs}s`;

  const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
  const visibleFindings = FINDINGS.slice(0, state.findingsCount);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
      {/* macOS title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[hsl(0_0%_5%)] border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground/50">
          Solarizer — VaultProtocol Audit
        </span>
        <div className="w-[52px]" />
      </div>

      {/* Fixed-height content area */}
      <div className="flex flex-col h-[480px] sm:h-[520px] overflow-hidden">
        <div className="p-3 sm:p-5 flex flex-col flex-1 min-h-0 space-y-4">
          {/* ── Project header ─────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/50">←</span>
                <h3 className="text-sm sm:text-base font-semibold text-foreground">VaultProtocol</h3>
              </div>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                4 contracts · 2,847 nLOC · {timeStr}
              </p>
            </div>
          </div>

          {/* ── Conditional: Progress Panel OR Score Card ─────── */}
          {!state.complete ? (
            /* AuditProgressPanel replica — full width */
            <div className="bg-card border border-primary/20 rounded-lg p-4 sm:p-5 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">Audit in Progress</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{timeStr}</span>
              </div>

              {/* Phases */}
              <div className="space-y-1 mb-3">
                <h4 className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Phases</h4>
                {PHASES.map((phase, idx) => {
                  const isDone = state.phaseIdx > idx;
                  const isActive = state.phaseIdx === idx;
                  const isPending = state.phaseIdx < idx;
                  let suffix = "";
                  if (isActive && phase === "Hunting") suffix = ` (${Math.min(state.contractIdx + 1, 4)}/4)`;

                  return (
                    <div key={phase} className={cn(
                      "flex items-center gap-2 py-1 px-2 -mx-2 rounded",
                      isActive && "bg-primary/5"
                    )}>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                      {isPending && <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                      <span className={cn(
                        "text-sm",
                        isDone && "text-success",
                        isActive && "text-primary font-medium",
                        isPending && "text-muted-foreground"
                      )}>
                        {phase}{suffix}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Contracts */}
              <div className="space-y-1">
                <h4 className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Contracts</h4>
                {CONTRACTS.map((c, idx) => {
                  const isDone = idx < state.contractIdx || state.phaseIdx > 0;
                  const isActive = idx === state.contractIdx && state.phaseIdx === 0;
                  return (
                    <div key={c.name} className="space-y-0.5">
                      <div className="flex items-center gap-2 py-0.5">
                        {isDone && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                        {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
                        {!isDone && !isActive && <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                        <span className={cn(
                          "text-sm truncate",
                          isDone && "text-success",
                          isActive && "text-primary font-medium",
                          !isDone && !isActive && "text-muted-foreground"
                        )}>
                          {c.name}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                          COMPLEXITY_STYLES[c.complexity] || COMPLEXITY_STYLES.L1
                        )}>
                          {c.complexity}
                        </span>
                      </div>
                      {/* Sub-phases for active contract */}
                      {isActive && (
                        <div className="ml-6 pl-3 border-l-2 border-border/40 space-y-0.5">
                          {SUB_PHASES.map((sp, spIdx) => {
                            const spDone = spIdx < state.subPhaseIdx;
                            const spActive = spIdx === state.subPhaseIdx;
                            return (
                              <div key={sp} className="flex items-center gap-2">
                                {spDone && <CheckCircle2 className="w-3 h-3 text-success shrink-0" />}
                                {spActive && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                                {!spDone && !spActive && <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
                                <span className={cn(
                                  "text-xs",
                                  spDone && "text-success",
                                  spActive && "text-primary",
                                  !spDone && !spActive && "text-muted-foreground"
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
            </div>
          ) : (
            /* SecurityScoreCard replica — full width on complete */
            <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shrink-0">
              {/* Grade + Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0",
                  state.score === 0 ? "border-muted" :
                  state.score >= 65 ? "border-success" : "border-warning"
                )}>
                  <span className={cn("text-xl font-bold", state.gradeColor)}>
                    {state.grade === "—" ? "--" : state.grade}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-lg font-semibold", state.gradeColor)}>
                      {GRADE_LABELS[state.grade] ?? "Pending"}
                    </span>
                    <span className="text-sm text-muted-foreground">Security Rating</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{GRADE_DESCRIPTIONS[state.grade] ?? ""}</p>
                </div>
              </div>

              {/* Vulnerability Matrix */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vulnerability Matrix</h4>
                  <span className="text-xs text-muted-foreground">{total} findings</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted flex overflow-hidden mb-3">
                  {VULN_CATEGORIES.map(cat => {
                    const count = state.counts[cat.key];
                    const width = total > 0 ? (count / total) * 100 : 0;
                    return width > 0 ? (
                      <div key={cat.key} className={cn("h-full transition-all duration-500", cat.barColor)} style={{ width: `${width}%` }} />
                    ) : null;
                  })}
                </div>
                {/* Category pills */}
                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                  {VULN_CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.key} className={cn(
                        "flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg border",
                        cat.bgColor, cat.borderColor
                      )}>
                        <CatIcon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", cat.textColor)} />
                        <span className={cn("text-xs sm:text-sm font-medium", cat.textColor)}>{state.counts[cat.key]}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">{cat.label}</span>
                        <span className="text-[11px] text-muted-foreground sm:hidden">{cat.label.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab bar (static) ───────────────────────────────── */}
          <div className="flex w-full overflow-x-auto no-scrollbar border-b border-border shrink-0">
            {[
              { label: "Scope",      icon: FileCode,   active: false },
              { label: "Insights",   icon: Lightbulb,  active: false },
              { label: "Invariants", icon: Shield,      active: false },
              { label: "Findings",   icon: AlertTriangle, active: true, count: state.findingsCount },
              { label: "Coverage",   icon: ShieldCheck, active: false },
              { label: "Archive",    icon: Archive,     active: false },
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <div
                  key={tab.label}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] sm:text-xs border-b-2 transition-colors cursor-default whitespace-nowrap",
                    tab.active
                      ? "border-primary text-foreground font-medium"
                      : "border-transparent text-muted-foreground/50"
                  )}
                >
                  <TabIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-muted-foreground/70">({tab.count})</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Findings list (scrollable within fixed container) */}
          <div className="overflow-y-auto flex-1 min-h-0 space-y-2.5">
            {visibleFindings.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                Scanning contracts...
              </div>
            ) : (
              visibleFindings.map((f, i) => {
                const config = SEVERITY_CONFIG[f.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={f.title}
                    className="border border-border rounded-lg overflow-hidden bg-card/50 animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 w-fit",
                          config.className
                        )}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{f.title}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto shrink-0">
                          <FileCode className="w-3 h-3" />
                          <span className="font-mono">L{f.lines}</span>
                        </div>
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="border-t border-border bg-[hsl(0_0%_4%)] px-3 sm:px-4 py-2 overflow-x-auto">
                        <pre className="text-[10px] sm:text-[11px] font-mono leading-relaxed">
                          {f.snippet.split("\n").map((line, li) => (
                            <div key={li} className="flex">
                              <span className="pr-3 text-right text-muted-foreground/30 select-none shrink-0 w-8">
                                {f.startLine + li}
                              </span>
                              <span className="text-foreground/80">{line}</span>
                            </div>
                          ))}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Complete banner */}
          {state.complete && (
            <div className="text-center py-2 text-xs text-success font-medium animate-fade-in shrink-0">
              ✓ Audit complete — full report ready
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAuditDemo;
