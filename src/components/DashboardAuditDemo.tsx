import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Circle, AlertTriangle, AlertCircle, Info, FileCode, Shield, Lightbulb, ShieldCheck, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  phaseIdx: number;           // 0-7, which phase is active
  findingsCount: number;
  score: number;
  grade: string;
  gradeColor: string;
  elapsed: number;
  contractIdx: number;        // which contract is active (0-3)
  subPhaseIdx: number;        // sub-phase within active contract
  complete?: boolean;
  counts: { critical: number; high: number; medium: number; low: number; info: number };
}

// ─── Static data ──────────────────────────────────────────────────────────

const PHASES = [
  "Complexity Analysis",
  "Session Start",
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

const FRAMES: FrameState[] = [
  // 0: Empty state
  { phaseIdx: 0, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 0, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } },
  // 1: Complexity done, Hunting starts
  { phaseIdx: 2, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 9, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } },
  // 2: First finding (CRITICAL), score 28
  { phaseIdx: 2, findingsCount: 1, score: 28, grade: "C+", gradeColor: "text-warning", elapsed: 51, contractIdx: 0, subPhaseIdx: 1, counts: { critical: 1, high: 0, medium: 0, low: 0, info: 0 } },
  // 3: Second finding (HIGH), score 44
  { phaseIdx: 2, findingsCount: 2, score: 44, grade: "C+", gradeColor: "text-warning", elapsed: 86, contractIdx: 1, subPhaseIdx: 0, counts: { critical: 1, high: 1, medium: 0, low: 0, info: 0 } },
  // 4: Third finding (HIGH), score 61
  { phaseIdx: 2, findingsCount: 3, score: 61, grade: "B", gradeColor: "text-success", elapsed: 118, contractIdx: 1, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 0, low: 0, info: 0 } },
  // 5: Fourth finding (MEDIUM), score 67, Hunting done
  { phaseIdx: 3, findingsCount: 4, score: 67, grade: "B", gradeColor: "text-success", elapsed: 149, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0 } },
  // 6: Validation
  { phaseIdx: 4, findingsCount: 4, score: 71, grade: "B", gradeColor: "text-success", elapsed: 163, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0 } },
  // 7: Reporting
  { phaseIdx: 7, findingsCount: 4, score: 74, grade: "B+", gradeColor: "text-success", elapsed: 180, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0 } },
  // 8: Complete
  { phaseIdx: 8, findingsCount: 4, score: 74, grade: "B+", gradeColor: "text-success", elapsed: 194, contractIdx: 3, subPhaseIdx: 2, complete: true, counts: { critical: 1, high: 2, medium: 1, low: 0, info: 0 } },
];

const FRAME_DELAYS = [1600, 2000, 1800, 1800, 2000, 1800, 2000, 2400, 5000];

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, label: "Critical", className: "text-critical bg-critical/10 border-critical/20" },
  high:     { icon: AlertTriangle, label: "High",     className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium:   { icon: AlertCircle,  label: "Medium",   className: "text-warning bg-warning/10 border-warning/20" },
} as const;

const VULN_CATEGORIES = [
  { label: "Crit", key: "critical" as const, barColor: "bg-critical",    bgColor: "bg-critical/10",    textColor: "text-critical",    borderColor: "border-critical/30" },
  { label: "High", key: "high" as const,     barColor: "bg-destructive", bgColor: "bg-destructive/10", textColor: "text-destructive", borderColor: "border-destructive/30" },
  { label: "Med",  key: "medium" as const,   barColor: "bg-warning",     bgColor: "bg-warning/10",     textColor: "text-warning",     borderColor: "border-warning/30" },
  { label: "Low",  key: "low" as const,      barColor: "bg-primary",     bgColor: "bg-primary/10",     textColor: "text-primary",     borderColor: "border-primary/30" },
  { label: "Info", key: "info" as const,      barColor: "bg-slate-400",   bgColor: "bg-slate-400/10",   textColor: "text-slate-400",   borderColor: "border-slate-400/30" },
];

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

  const circumference = 2 * Math.PI * 45;
  const strokeOffset = circumference - (state.score / 100) * circumference;
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

      <div className="p-4 sm:p-5 space-y-4">
        {/* ── Project header ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
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

        {/* ── Two-column: Score + Progress ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          {/* SecurityScoreCard replica */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
            <div className="flex items-center gap-5">
              {/* Circular Progress */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="stroke-muted" strokeWidth="6" fill="none" />
                  <circle
                    cx="50" cy="50" r="45"
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      state.score === 0 ? "stroke-muted" :
                      state.score >= 65 ? "stroke-success" : "stroke-warning"
                    )}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-xl sm:text-2xl font-bold", state.gradeColor)}>
                    {state.grade}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {state.score > 0 ? `${state.score}/100` : "—/100"}
                  </span>
                </div>
              </div>

              {/* Score details */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-base sm:text-lg font-semibold", state.gradeColor)}>
                      {state.score === 0 ? "Pending" : state.score >= 75 ? "Good" : state.score >= 65 ? "Good" : "Fair"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Security Rating</span>
                  </div>
                </div>

                {/* Vulnerability Matrix Bar */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Vulnerability Matrix
                    </span>
                    <span className="text-[10px] text-muted-foreground">{total} findings</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted flex overflow-hidden mb-2">
                    {VULN_CATEGORIES.map(cat => {
                      const count = state.counts[cat.key];
                      const width = total > 0 ? (count / total) * 100 : 0;
                      return width > 0 ? (
                        <div key={cat.key} className={cn("h-full transition-all duration-500", cat.barColor)} style={{ width: `${width}%` }} />
                      ) : null;
                    })}
                  </div>
                  {/* Category pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {VULN_CATEGORIES.map(cat => (
                      <div key={cat.key} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]", cat.bgColor, cat.borderColor)}>
                        <span className={cn("font-medium", cat.textColor)}>{state.counts[cat.key]}</span>
                        <span className="text-muted-foreground">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AuditProgressPanel replica */}
          <div className="bg-card border border-primary/20 rounded-lg p-4 sm:p-5 md:w-56 lg:w-64">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {!state.complete ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                )}
                <span className="text-xs font-medium text-foreground">
                  {state.complete ? "Audit Complete" : "Audit in Progress"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{timeStr}</span>
            </div>

            {/* Phases */}
            <div className="space-y-0.5 mb-3">
              <h4 className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Phases</h4>
              {PHASES.map((phase, idx) => {
                const isDone = state.phaseIdx > idx;
                const isActive = state.phaseIdx === idx;
                const isPending = state.phaseIdx < idx;
                let suffix = "";
                if (isActive && phase === "Hunting") suffix = ` (${Math.min(state.contractIdx + 1, 4)}/4)`;

                return (
                  <div key={phase} className="flex items-center gap-1.5 py-px">
                    {isDone && <CheckCircle2 className="w-3 h-3 text-success shrink-0" />}
                    {isActive && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                    {isPending && <Circle className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                    <span className={cn(
                      "text-[10px]",
                      isDone && "text-success",
                      isActive && "text-primary font-medium",
                      isPending && "text-muted-foreground/50"
                    )}>
                      {phase}{suffix}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Contracts */}
            <div className="space-y-0.5">
              <h4 className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Contracts</h4>
              {CONTRACTS.map((c, idx) => {
                const isDone = idx < state.contractIdx || state.phaseIdx > 2;
                const isActive = idx === state.contractIdx && state.phaseIdx === 2;
                return (
                  <div key={c.name} className="space-y-0.5">
                    <div className="flex items-center gap-1.5 py-px">
                      {isDone && <CheckCircle2 className="w-3 h-3 text-success shrink-0" />}
                      {isActive && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                      {!isDone && !isActive && <Circle className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
                      <span className={cn(
                        "text-[10px] truncate",
                        isDone && "text-success",
                        isActive && "text-primary font-medium",
                        !isDone && !isActive && "text-muted-foreground/50"
                      )}>
                        {c.name}
                      </span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 shrink-0">
                        {c.complexity}
                      </Badge>
                    </div>
                    {/* Sub-phases for active contract */}
                    {isActive && (
                      <div className="ml-5 space-y-px">
                        {SUB_PHASES.map((sp, spIdx) => {
                          const spDone = spIdx < state.subPhaseIdx;
                          const spActive = spIdx === state.subPhaseIdx;
                          return (
                            <div key={sp} className="flex items-center gap-1.5">
                              {spDone && <CheckCircle2 className="w-2.5 h-2.5 text-success shrink-0" />}
                              {spActive && <Loader2 className="w-2.5 h-2.5 animate-spin text-primary shrink-0" />}
                              {!spDone && !spActive && <Circle className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />}
                              <span className={cn(
                                "text-[9px]",
                                spDone && "text-success",
                                spActive && "text-primary",
                                !spDone && !spActive && "text-muted-foreground/50"
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
        </div>

        {/* ── Tab bar (static) ───────────────────────────────── */}
        <div className="flex w-full overflow-x-auto no-scrollbar border-b border-border">
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

        {/* ── Findings list ──────────────────────────────────── */}
        <div className="space-y-2.5 min-h-[120px]">
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
                  {/* Finding header */}
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
                  {/* Code snippet */}
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
          <div className="text-center py-2 text-xs text-success font-medium animate-fade-in">
            ✓ Audit complete — full report ready
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAuditDemo;
