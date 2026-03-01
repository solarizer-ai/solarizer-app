import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, Loader2, Circle, AlertTriangle, AlertCircle, Info, FileCode, Shield, Lightbulb, ShieldCheck, Archive, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

interface DemoFinding {
  severity: "critical" | "high" | "medium" | "low" | "gas";
  title: string;
  location: string;
  lines: string;
  snippet: string;
  startLine: number;
}

interface FrameState {
  phaseIdx: number;
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
  // ── CRITICAL ─────────────────────────────────────────────────────────────
  { severity: "critical", title: "Fee accounting desync in LiquidityPool collectFees drains reserves without updating reserveA/reserveB", location: "PoolHooks.sol", lines: "1316-1340", startLine: 1316, snippet: "" },
  { severity: "critical", title: "Uncapped Pro-Rata Fee Calculation Can Cause Permanent Freezing of Funds in Consuming Contracts", location: "PoolHooks.sol", lines: "1316-1340", startLine: 1316, snippet: "" },
  // ── HIGH ──────────────────────────────────────────────────────────────────
  { severity: "high", title: "Denial of Service in Settlement via Dust Redemption Requests", location: "HookFeeManager.sol", lines: "1237-1253", startLine: 1237, snippet: "" },
  { severity: "high", title: "executeQueuedHookFeesByHookTransfers clears reentrancy flags then performs external transfers enabling reentrancy", location: "PoolHooks.sol", lines: "1316-1340", startLine: 1316, snippet: `_reentrancyFlags = 0;\ntoken.transfer(recipient, amount);` },
  // ── MEDIUM ───────────────────────────────────────────────────────────────
  { severity: "medium", title: "createPool clears reentrancy guard before delegatecall to addLiquidity, enabling re-entry during hook execution", location: "PoolManager.sol", lines: "18-42", startLine: 18, snippet: `_reentrancyGuard = false;\naddress(this).delegatecall(...)` },
  { severity: "medium", title: "Flashloan fee accounting allows fee token surplus to be double-counted as protocol fees", location: "FlashLoan.sol", lines: "1139-1218", startLine: 1139, snippet: `protocolFees += surplus;\nprotocolFees += (borrowed * flashLoanBPS) / BPS_DENOMINATOR;` },
  { severity: "medium", title: "_executePoolFeeHook subtracts hook fees from amount in unchecked block without validating totalHookFees <= amount", location: "PoolHooks.sol", lines: "91-115", startLine: 91, snippet: `unchecked { amountOut -= totalHookFees; }` },
  // ── LOW ───────────────────────────────────────────────────────────────────
  { severity: "low", title: "_poolSwapByInput partial fill adjusts exchangeFeeAmount but not feeOnTopAmount, causing incorrect fee distribution", location: "SwapRouter.sol", lines: "91-115", startLine: 91, snippet: `exchangeFeeAmount = (filled * feeBPS) / BPS;` },
  { severity: "low", title: "Flashloan fee calculation incorrect when tokenFeeAmount > 0 — protocol overcharges and accounting mismatch", location: "FlashLoan.sol", lines: "91-115", startLine: 91, snippet: `fee = (amount * flashLoanBPS) / BPS + tokenFeeAmount;` },
  { severity: "low", title: "setFlashloanFee allows setting flashLoanBPS above MAX_BPS, permanently disabling flashloans", location: "FlashLoan.sol", lines: "75-82", startLine: 75, snippet: `flashLoanBPS = bps;` },
  { severity: "low", title: "Inconsistent exchange fee BPS boundary: input swaps allow 100% fee (BPS=10000) while output swaps reject it", location: "SwapRouter.sol", lines: "91-115", startLine: 91, snippet: `require(feeBPS <= BPS);\nrequire(feeBPS < BPS);` },
  // ── GAS ───────────────────────────────────────────────────────────────────
  { severity: "gas", title: "Redundant FixedPositionInfo storage positionCache alias in _collectPosition", location: "PositionManager.sol", lines: "340-370", startLine: 340, snippet: `FixedPositionInfo storage positionCache = positions[id];` },
  { severity: "gas", title: "Height state written back unconditionally even when unchanged", location: "PositionManager.sol", lines: "1957-1968", startLine: 1957, snippet: `poolState.height = newHeight;` },
  { severity: "gas", title: "Unused address parameter in collectFees, addLiquidity, removeLiquidity", location: "PositionManager.sol", lines: "157-165", startLine: 157, snippet: `function collectFees(address recipient, ...)` },
  { severity: "gas", title: "Redundant storage pointer in _calculatePosition for positionCache", location: "PositionManager.sol", lines: "195-196", startLine: 195, snippet: `FixedPositionInfo storage positionCache = _positions[posId];` },
  { severity: "gas", title: "Redundant storage reads for pool state in view functions", location: "PoolManager.sol", lines: "370-390", startLine: 370, snippet: `pools[poolId].liquidity;\npools[poolId].sqrtPrice;\npools[poolId].fee;` },
];

const FRAMES: FrameState[] = [
  { phaseIdx: 0, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 0, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 0, score: 0, grade: "—", gradeColor: "text-muted-foreground/20", elapsed: 9, contractIdx: 0, subPhaseIdx: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 1, score: 12, grade: "F", gradeColor: "text-critical", elapsed: 51, contractIdx: 0, subPhaseIdx: 1, counts: { critical: 1, high: 0, medium: 0, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 3, score: 18, grade: "F", gradeColor: "text-critical", elapsed: 86, contractIdx: 1, subPhaseIdx: 0, counts: { critical: 1, high: 1, medium: 1, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 0, findingsCount: 5, score: 22, grade: "F", gradeColor: "text-critical", elapsed: 118, contractIdx: 1, subPhaseIdx: 2, counts: { critical: 2, high: 2, medium: 1, low: 0, info: 0, gas: 0 } },
  { phaseIdx: 1, findingsCount: 8, score: 28, grade: "F", gradeColor: "text-critical", elapsed: 149, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 2, high: 2, medium: 3, low: 1, info: 0, gas: 0 } },
  { phaseIdx: 2, findingsCount: 10, score: 32, grade: "F", gradeColor: "text-critical", elapsed: 163, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 2, high: 2, medium: 3, low: 3, info: 0, gas: 0 } },
  { phaseIdx: 5, findingsCount: 14, score: 36, grade: "F", gradeColor: "text-critical", elapsed: 180, contractIdx: 3, subPhaseIdx: 2, counts: { critical: 2, high: 2, medium: 3, low: 4, info: 0, gas: 3 } },
  { phaseIdx: 6, findingsCount: 16, score: 38, grade: "F", gradeColor: "text-critical", elapsed: 194, contractIdx: 3, subPhaseIdx: 2, complete: true, counts: { critical: 2, high: 2, medium: 3, low: 4, info: 0, gas: 5 } },
];

const FRAME_DELAYS = [1600, 2000, 1800, 1800, 2000, 1800, 2000, 2400, 5000];

const SEVERITY_CONFIG: Record<DemoFinding["severity"], { icon: typeof AlertTriangle; label: string; className: string }> = {
  critical: { icon: AlertTriangle, label: "Critical", className: "text-critical bg-critical/10 border-critical/20" },
  high:     { icon: AlertTriangle, label: "High",     className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium:   { icon: AlertCircle,  label: "Medium",   className: "text-warning bg-warning/10 border-warning/20" },
  low:      { icon: Info,         label: "Low",      className: "text-low bg-low/10 border-low/20" },
  gas:      { icon: Fuel,         label: "Gas",      className: "text-green-500 bg-green-500/10 border-green-500/20" },
};

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

const FIXED_W = 1024;
const FIXED_H = 640;

// ─── Component ────────────────────────────────────────────────────────────

const DashboardAuditDemo = () => {
  const [frameIdx, setFrameIdx] = useState(0);
  const [tickOffset, setTickOffset] = useState(0);
  const [scale, setScale] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const outerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver for scale
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? FIXED_W;
      setScale(Math.min(w / FIXED_W, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const delay = FRAME_DELAYS[frameIdx] ?? 2000;
    timerRef.current = setTimeout(() => {
      setFrameIdx(f => (f >= FRAMES.length - 1 ? f : f + 1));
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

  // Shared phase/finding state for mobile card
  const currentPhase = PHASES[Math.min(state.phaseIdx, PHASES.length - 1)];
  const phaseProgress = state.complete ? PHASES.length : Math.min(state.phaseIdx + 1, PHASES.length);

  return (
    <>
    {/* ── Mobile simplified card ── */}
    <div className="sm:hidden rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
      <div className="px-4 py-3 bg-[hsl(0_0%_5%)] border-b border-border flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground/50">Solarizer</span>
        <span className="text-[10px] font-mono text-muted-foreground/40">{timeStr}</span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">VaultProtocol</h3>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">4 contracts · 2,847 nLOC</p>
        </div>

        {!state.complete ? (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-xs font-medium text-primary">{currentPhase}</span>
              <span className="text-[10px] text-muted-foreground/40 ml-auto">{phaseProgress}/{PHASES.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(phaseProgress / PHASES.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0",
                "border-critical"
              )}>
                <span className="text-sm font-bold text-critical">{state.grade}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-critical">Critical</span>
                <p className="text-[10px] text-muted-foreground">Security Rating</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {VULN_CATEGORIES.filter(cat => state.counts[cat.key] > 0).map(cat => (
            <div key={cat.key} className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md border text-[10px]",
              cat.bgColor, cat.borderColor
            )}>
              <span className={cn("font-medium", cat.textColor)}>{state.counts[cat.key]}</span>
              <span className="text-muted-foreground">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── Desktop full demo ── */}
    <div
      ref={outerRef}
      className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden shadow-2xl relative"
      style={{ height: FIXED_H * scale }}
    >
      <div
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: FIXED_W,
          height: FIXED_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
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
        <div className="flex flex-col h-[600px] overflow-hidden">
          <div className="p-5 flex flex-col flex-1 min-h-0 space-y-4">
            {/* ── Project header ─────────────────────────────────── */}
            <div className="flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/50">←</span>
                  <h3 className="text-base font-semibold text-foreground">VaultProtocol</h3>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                  4 contracts · 2,847 nLOC · {timeStr}
                </p>
              </div>
            </div>

            {/* ── Conditional: Progress Panel OR Score Card ─────── */}
            {!state.complete ? (
              <div className="bg-card border border-primary/20 rounded-lg p-5 shrink-0">
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
              <div className="bg-card border border-border rounded-lg p-5 shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0",
                    state.score === 0 ? "border-muted" :
                    state.grade === "F" ? "border-critical" :
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
                  <div className="flex flex-wrap gap-2">
                    {VULN_CATEGORIES.map(cat => {
                      const CatIcon = cat.icon;
                      return (
                        <div key={cat.key} className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border",
                          cat.bgColor, cat.borderColor
                        )}>
                          <CatIcon className={cn("w-3.5 h-3.5", cat.textColor)} />
                          <span className={cn("text-sm font-medium", cat.textColor)}>{state.counts[cat.key]}</span>
                          <span className="text-xs text-muted-foreground">{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab bar ───────────────────────────────── */}
            <div className="flex w-full overflow-x-auto no-scrollbar border-b border-border shrink-0">
              {[
                { label: "Scope",      icon: FileCode,   active: false },
                { label: "Insights",   icon: Lightbulb,  active: false },
                { label: "Invariants", icon: Shield,      active: false },
                { label: "Findings",   icon: AlertTriangle, active: true },
                { label: "Coverage",   icon: ShieldCheck, active: false },
                { label: "Archive",    icon: Archive,     active: false },
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <div
                    key={tab.label}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border-b-2 transition-colors cursor-default whitespace-nowrap",
                      tab.active
                        ? "border-primary text-foreground font-medium"
                        : "border-transparent text-muted-foreground/50"
                    )}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </div>
                );
              })}
            </div>

            {/* ── Findings list */}
            <div className="overflow-hidden flex-1 min-h-0 space-y-2.5">
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
                      className="flex items-center gap-3 p-2.5 px-3 border border-border rounded-lg bg-card/50 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0",
                        config.className
                      )}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{f.title}</p>
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
    </div>
    </>
  );
};

export default DashboardAuditDemo;
