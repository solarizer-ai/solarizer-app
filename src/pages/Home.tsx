import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Search,
  Shield,
  GitBranch,
  FileText,
  CheckCircle2,
  EyeOff,
  Workflow,
  Monitor,
  Zap,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardAuditDemo from "@/components/DashboardAuditDemo";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { FitText } from "@/components/FitText";
import { cn } from "@/lib/utils";

// ─── Data ──────────────────────────────────────────────────────────────────

const phases = [
  {
    num: "01",
    pill: "Smart Scoping",
    icon: Layers,
    description:
      "Contracts classified by complexity (L1/L2/L3) to route analysis depth — simple contracts move fast, novel mechanisms trigger deeper passes.",
  },
  {
    num: "02",
    pill: "Pattern Intelligence",
    icon: Search,
    description:
      "Every function matched against a curated database of real-world exploit signatures from hundreds of protocol hacks.",
  },
  {
    num: "03",
    pill: "Multi-Pass Hunting",
    icon: Shield,
    description:
      "Broad reconnaissance across all contracts, then deep-dive on complex contracts. Self-adversarial verification on every finding.",
  },
  {
    num: "04",
    pill: "Cross-Contract",
    icon: GitBranch,
    description:
      "Attack paths traced across contract boundaries — shared state, callback ordering, flash loan cascades.",
  },
  {
    num: "05",
    pill: "Validation",
    icon: CheckCircle2,
    description:
      "Independent AI re-examines every finding against actual source code. False positives filtered before they reach you.",
  },
  {
    num: "06",
    pill: "QA Scan",
    icon: Zap,
    description:
      "Gas optimizations, floating pragmas, missing events, unchecked returns, input validation — the details that matter.",
  },
  {
    num: "07",
    pill: "Report Generation",
    icon: FileText,
    description:
      "Line-accurate findings with code snippets, impact analysis, and actionable remediation guidance.",
  },
];

const capabilities = [
  {
    title: "Invariant-Guided Analysis",
    copy: "Discovers your protocol's fundamental invariants — the balance equations, access rules, and state assumptions that must always hold. Every finding is checked against these properties to surface truly critical violations.",
    demo: "invariant",
  },
  {
    title: "Cross-Contract Analysis",
    copy: "Traces exploit paths across contract boundaries. Fund flow manipulation, callback ordering attacks, shared state corruption, and flash loan cascades — analyzed as a connected system, not in isolation.",
    demo: "crossContract",
  },
  {
    title: "Multi-Pass Hunting",
    copy: "Two-pass analysis: broad reconnaissance across all contracts, then a deep-dive on complex contracts targeting areas the first pass missed. Every finding is self-verified before reporting.",
    demo: "hunting",
  },
  {
    title: "Robust Validation",
    copy: "A separate AI engine independently re-examines every finding against your actual source code. It reads functions, traces guard conditions, and checks preconditions — filtering false positives before they reach you.",
    demo: "validation",
  },
];


const knownFindings = [
  {
    severity: "CRITICAL" as const,
    title: "Read-only reentrancy via getPricePerShare()",
    description:
      "getPricePerShare() reads totalAssets() during an active withdrawal. An attacker exploits this stale mid-callback value to inflate collateral valuation in a dependent lending protocol.",
    file: "Vault.sol",
    line: "line 334",
    expanded: true,
    remediation: "Move the state update (_burn) before the external call, or use a reentrancy guard on getPricePerShare(). Consider implementing a snapshot-based pricing mechanism.",
  },
  {
    severity: "HIGH" as const,
    title: "Fee-on-transfer token insolvency in deposit()",
    description:
      "Protocol records msg.value as deposited without measuring the actual received balance. Recorded liability grows faster than real holdings.",
    file: "DepositHandler.sol",
    line: "line 89",
    expanded: false,
  },
  {
    severity: "MEDIUM" as const,
    title: "TWAP window insufficient for low-liquidity pairs",
    description:
      "15-minute window allows single-block price manipulation on thin markets, affecting liquidations, collateral checks, and rebalances.",
    file: "PriceOracle.sol",
    line: "line 211",
    expanded: false,
  },
];

const protocolFindings = [
  {
    severity: "CRITICAL" as const,
    title: "Epoch boundary reward over-distribution",
    description:
      "Users entering the final block of an epoch receive a full allocation. Combined with rebasing, repeated entry-exit systematically drains the rewards reserve.",
    file: "RewardVault.sol",
    line: "line 298",
    expanded: false,
  },
  {
    severity: "HIGH" as const,
    title: "Liquidation threshold bypass via callback ordering",
    description:
      "The collateral ratio check in liquidate() fires after the external repayment call. An attacker re-enters addCollateral() mid-liquidation.",
    file: "LendingCore.sol",
    line: "line 167",
    expanded: false,
  },
];

const qaFindings = [
  {
    severity: "GAS" as const,
    title: "Redundant storage reads in view functions",
    file: "PoolManager.sol",
    line: "line 370",
    expanded: false,
  },
  {
    severity: "GAS" as const,
    title: "Unused parameter in collectFees",
    file: "PositionManager.sol",
    line: "line 157",
    expanded: false,
  },
];

const builtDifferentFeatures = [
  {
    title: "Multi-Agent Analysis",
    icon: Shield,
    copy: "Not a single model guessing. A coordinated ensemble of specialized AI agents — each purpose-built for a different class of vulnerability. Findings are cross-validated before they reach you.",
    demo: "agents",
  },
  {
    title: "Reproducible Results",
    icon: Workflow,
    copy: "Every audit follows the same structured multi-phase pipeline. Consistent results. Same structured pipeline, same depth, every time.",
    demo: "pipeline",
  },
  {
    title: "Real-Time Dashboard",
    icon: Monitor,
    copy: "Upload contracts, configure scope, and watch your audit progress in real-time. Phase-by-phase updates, live finding counts, and instant notification when your report is ready.",
    demo: "progress",
  },
  {
    title: "Isolated Execution",
    icon: Lock,
    copy: "Every audit runs in its own isolated container — sandboxed from all other sessions and destroyed the moment your scan completes. No shared infrastructure. No cross-contamination risk.",
    demo: "container",
  },
  {
    title: "No Data Retention",
    icon: EyeOff,
    copy: "We never store your source code beyond the active scan. We never train our models on your codebase. When the audit ends, everything is purged. Your code is yours — period.",
    demo: "dataLifecycle",
  },
  {
    title: "Line-Accurate Fixes",
    icon: FileText,
    copy: "Every finding references exact contract names, line numbers, vulnerable code snippets, severity, impact analysis, and step-by-step remediation guidance you can apply immediately.",
    demo: "lineAccurate",
  },
];

const severityStyles: Record<string, { badge: string; border: string; text: string }> = {
  CRITICAL: { badge: "bg-critical/10 text-critical", border: "border-l-critical", text: "text-critical" },
  HIGH: { badge: "bg-destructive/10 text-destructive", border: "border-l-destructive", text: "text-destructive" },
  MEDIUM: { badge: "bg-warning/10 text-warning", border: "border-l-warning", text: "text-warning" },
  LOW: { badge: "bg-low/10 text-low", border: "border-l-low", text: "text-low" },
  GAS: { badge: "bg-green-500/10 text-green-500", border: "border-l-green-500", text: "text-green-500" },
};

// ─── Solidity code snippet (static React elements, no innerHTML) ───────

const codeLines = [
  { num: 1, tokens: [{ text: "function ", cls: "text-purple-400" }, { text: "getPricePerShare", cls: "text-foreground/80" }, { text: "()", cls: "text-muted-foreground/50" }, { text: " public view returns ", cls: "text-purple-400" }, { text: "(", cls: "text-muted-foreground/50" }, { text: "uint256", cls: "text-purple-400" }, { text: ") {", cls: "text-muted-foreground/50" }] },
  { num: 2, tokens: [{ text: "    ", cls: "" }, { text: "// VULNERABILITY: reads totalAssets() mid-withdrawal", cls: "text-muted-foreground/40" }] },
  { num: 3, tokens: [{ text: "    return totalAssets", cls: "text-foreground/80" }, { text: "()", cls: "text-muted-foreground/50" }, { text: " * PRECISION / totalSupply", cls: "text-foreground/80" }, { text: "();", cls: "text-muted-foreground/50" }] },
  { num: 4, tokens: [{ text: "}", cls: "text-muted-foreground/50" }] },
  { num: 5, tokens: [] },
  { num: 6, tokens: [{ text: "function ", cls: "text-purple-400" }, { text: "withdraw", cls: "text-foreground/80" }, { text: "(", cls: "text-muted-foreground/50" }, { text: "uint256", cls: "text-purple-400" }, { text: " shares", cls: "text-foreground/80" }, { text: ") ", cls: "text-muted-foreground/50" }, { text: "external", cls: "text-purple-400" }, { text: " {", cls: "text-muted-foreground/50" }] },
  { num: 7, tokens: [{ text: "    ", cls: "" }, { text: "uint256", cls: "text-purple-400" }, { text: " assets = shares * getPricePerShare", cls: "text-foreground/80" }, { text: "()", cls: "text-muted-foreground/50" }, { text: " / PRECISION", cls: "text-foreground/80" }, { text: ";", cls: "text-muted-foreground/50" }] },
  { num: 8, tokens: [{ text: "    ", cls: "" }, { text: "// External call before state update", cls: "text-muted-foreground/40" }] },
  { num: 9, tokens: [{ text: "    token.transfer", cls: "text-foreground/80" }, { text: "(", cls: "text-muted-foreground/50" }, { text: "msg", cls: "text-purple-400" }, { text: ".sender, assets", cls: "text-foreground/80" }, { text: ");", cls: "text-muted-foreground/50" }] },
  { num: 10, tokens: [{ text: "    _burn", cls: "text-foreground/80" }, { text: "(", cls: "text-muted-foreground/50" }, { text: "msg", cls: "text-purple-400" }, { text: ".sender, shares", cls: "text-foreground/80" }, { text: ");", cls: "text-muted-foreground/50" }] },
  { num: 11, tokens: [{ text: "}", cls: "text-muted-foreground/50" }] },
];

const SolidityCodeBlock = () => (
  <div className="mt-3 bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg p-3 font-mono text-[11px] overflow-x-auto">
    {codeLines.map((line) => (
      <div key={line.num} className="flex">
        <span className="text-muted-foreground/20 w-8 text-right pr-3 select-none shrink-0">{line.num}</span>
        <span>
          {line.tokens.map((tok, i) => (
            <span key={i} className={tok.cls}>{tok.text}</span>
          ))}
          {line.tokens.length === 0 && "\u00A0"}
        </span>
      </div>
    ))}
  </div>
);

// ─── Inline demo sub-components ─────────────────────────────────────────

const InvariantDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="flex items-center justify-between text-muted-foreground/50 mb-2.5">
      <span>Protocol Invariants</span>
      <span>3 identified</span>
    </div>
    <div className="border-t border-border/10 pt-2.5 space-y-2">
      {[
        { sev: "CRITICAL", text: "totalSupply == sum(balances)" },
        { sev: "CRITICAL", text: "reserves >= totalLiabilities" },
        { sev: "HIGH", text: "onlyOwner can update fee basis" },
      ].map((inv) => (
        <div key={inv.text} className="flex items-start gap-2">
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-px",
            inv.sev === "CRITICAL" ? "bg-critical/10 text-critical" : "bg-destructive/10 text-destructive"
          )}>
            {inv.sev}
          </span>
          <span className="text-muted-foreground/70">{inv.text}</span>
        </div>
      ))}
    </div>
  </div>
);

const CrossContractDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="border-l-2 border-l-critical pl-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="bg-critical/10 text-critical text-[9px] font-bold px-1.5 py-0.5 rounded">CRITICAL</span>
      </div>
      <p className="text-foreground/90 text-xs font-medium leading-snug">
        Liquidation bypass via callback ordering in LendingCore → Vault
      </p>
      <p className="text-muted-foreground/40 text-[10px]">
        LendingCore.sol · lines 167-189
      </p>
      <p className="text-muted-foreground/50 text-[10px] leading-relaxed mt-1">
        collateralCheck fires after external repayment call, enabling re-entry
      </p>
    </div>
  </div>
);

const HuntingDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="flex items-center justify-between text-muted-foreground/50 mb-2.5">
      <span>Contracts</span>
      <span>3/4</span>
    </div>
    <div className="border-t border-border/10 pt-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-green-400">✓</span>
        <span className="text-muted-foreground/70 flex-1">Vault.sol</span>
        <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded">L2</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary">●</span>
        <span className="text-primary flex-1">LendingCore.sol</span>
        <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded">L3</span>
      </div>
      <div className="ml-5 pl-3 border-l border-border/20 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <span className="text-green-400 text-[10px]">✓</span>
          <span>Pattern Match</span>
        </div>
        <div className="flex items-center gap-1.5 text-primary">
          <span className="text-[10px]">●</span>
          <span>Initial Scan</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/30">
          <span className="text-[10px]">○</span>
          <span>Deep Scan</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/30">○</span>
        <span className="text-muted-foreground/40 flex-1">PriceOracle.sol</span>
        <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded">L1</span>
      </div>
    </div>
  </div>
);

const ValidationDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="flex items-center justify-between text-muted-foreground/50 mb-2.5">
      <span>Validation Results</span>
      <span>5 findings</span>
    </div>
    <div className="border-t border-border/10 pt-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-green-400">✓</span>
        <span className="text-muted-foreground/70 flex-1">Confirmed</span>
        <span className="text-green-400">3</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-amber-400">↓</span>
        <span className="text-muted-foreground/70 flex-1">Severity adjusted</span>
        <span className="text-amber-400">1</span>
        <span className="text-muted-foreground/30 text-[10px]">HIGH → MEDIUM</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-red-400">✗</span>
        <span className="text-muted-foreground/70 flex-1">False positive</span>
        <span className="text-red-400">1</span>
      </div>
    </div>
    <div className="border-t border-border/10 mt-2.5 pt-2 text-muted-foreground/40">
      Code inspections: 12 functions verified
    </div>
  </div>
);

const AgentsDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="flex items-center justify-between gap-2">
      {["Scoping", "Hunting", "Validation", "Reporting"].map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
          </div>
          <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">{label}</span>
          <span className="text-[8px] text-muted-foreground/30 whitespace-nowrap">
            {["classify", "red-team", "verify", "enrich"][i]}
          </span>
        </div>
      ))}
    </div>
    <div className="flex justify-between mt-2 px-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-8 h-px bg-primary/20" />
      ))}
    </div>
  </div>
);

const PipelineTimingDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="space-y-1">
      {[
        { label: "Scoping", time: "4s" },
        { label: "Pattern Match", time: "8s" },
        { label: "Hunting (P1+P2)", time: "2m 18s" },
        { label: "Cross-Contract", time: "1m 04s" },
        { label: "Validation", time: "34s" },
        { label: "QA Scan", time: "22s" },
        { label: "Report", time: "3s" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-muted-foreground/50">
          <span className="text-green-400 text-[10px]">✓</span>
          <span className="flex-1">{item.label}</span>
          <span className="text-muted-foreground/25 tabular-nums">{item.time}</span>
        </div>
      ))}
    </div>
    <div className="border-t border-border/10 mt-2 pt-2 flex items-center justify-between text-muted-foreground/60">
      <span>Total</span>
      <span className="text-foreground/80 font-medium">4m 45s</span>
    </div>
  </div>
);

const ProgressDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5">
        <span className="text-primary animate-pulse">●</span>
        <span className="text-foreground/80">Audit in Progress</span>
      </div>
      <span className="text-muted-foreground/40 tabular-nums">2m 18s</span>
    </div>
    <div className="border-t border-border/10 pt-2 space-y-1">
      {[
        { label: "Preparing", done: true },
        { label: "Hunting (3/4)", done: true },
        { label: "Cross-Contract", active: true },
        { label: "Validation", pending: true },
        { label: "QA Scan", pending: true },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.done && <span className="text-green-400 text-[10px]">✓</span>}
          {item.active && <span className="text-primary text-[10px]">●</span>}
          {item.pending && <span className="text-muted-foreground/30 text-[10px]">○</span>}
          <span className={cn(
            item.done && "text-muted-foreground/50",
            item.active && "text-primary",
            item.pending && "text-muted-foreground/30"
          )}>{item.label}</span>
        </div>
      ))}
    </div>
    <div className="border-t border-border/10 mt-2 pt-2 space-y-1">
      <div className="flex items-center justify-between text-muted-foreground/50">
        <span>Findings:</span>
        <span className="text-foreground/70">8</span>
      </div>
      <div className="flex gap-2 text-[10px]">
        <span className="text-critical">critical 2</span>
        <span className="text-destructive">high 2</span>
        <span className="text-warning">medium 3</span>
        <span className="text-low">low 1</span>
      </div>
    </div>
  </div>
);

const ContainerDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="border border-border/20 rounded-lg p-3">
      <p className="text-muted-foreground/50 text-[10px] mb-2">Container #a8f2</p>
      <div className="space-y-1 text-muted-foreground/60">
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-[10px]">●</span>
          <span>Isolated runtime</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-[10px]">●</span>
          <span>No network access</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-[10px]">●</span>
          <span>Ephemeral storage</span>
        </div>
      </div>
    </div>
    <div className="mt-2 text-muted-foreground/40 text-[10px]">
      Status: <span className="text-green-400/70">terminated</span> · 0 artifacts
    </div>
  </div>
);

const DataLifecycleDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="space-y-1.5 text-muted-foreground/60">
      {[
        { step: "Upload", action: "Encrypted transit" },
        { step: "Analysis", action: "Isolated container" },
        { step: "Report", action: "Delivered to you" },
        { step: "Cleanup", action: "All data destroyed" },
      ].map((item) => (
        <div key={item.step} className="flex items-center gap-2">
          <span className="text-muted-foreground/40 w-14">{item.step}</span>
          <span className="text-muted-foreground/20">→</span>
          <span>{item.action}</span>
        </div>
      ))}
    </div>
    <div className="border-t border-border/10 mt-2.5 pt-2 space-y-1">
      {["No code stored", "No model training", "No logs retained"].map((text) => (
        <div key={text} className="flex items-center gap-1.5 text-red-400/60">
          <span className="text-[10px]">✗</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  </div>
);

const LineAccurateDemo = () => (
  <div className="bg-[hsl(0_0%_4%)] border border-border/10 rounded-lg px-4 py-3 font-mono text-[11px]">
    <div className="space-y-1 text-muted-foreground/60">
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-[10px]">✓</span>
        <span>Contract + line number</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-[10px]">✓</span>
        <span>Vulnerable code snippet</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-[10px]">✓</span>
        <span>Impact analysis</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-400 text-[10px]">✓</span>
        <span>Step-by-step remediation</span>
      </div>
    </div>
    <div className="border-t border-border/10 mt-2.5 pt-2 text-muted-foreground/40 text-[10px]">
      avg. 4.2 code references per finding
    </div>
  </div>
);

const ScoreDemo = () => (
  <div className="bg-foreground/[0.02] border border-border/10 rounded-xl p-5 mt-8">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full border-2 border-critical flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold text-critical">F</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-critical font-semibold">Critical</span>
          <span className="text-muted-foreground/50 text-sm">· 16 findings</span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/40 mb-2">Vulnerability Matrix</p>
        <div className="h-2 rounded-full bg-muted flex overflow-hidden mb-2">
          <div className="bg-critical h-full" style={{ width: "12.5%" }} />
          <div className="bg-destructive h-full" style={{ width: "12.5%" }} />
          <div className="bg-warning h-full" style={{ width: "18.75%" }} />
          <div className="bg-low h-full" style={{ width: "25%" }} />
          <div className="bg-green-500 h-full" style={{ width: "31.25%" }} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono">
          <span className="text-critical">Critical 2</span>
          <span className="text-destructive">High 2</span>
          <span className="text-warning">Medium 3</span>
          <span className="text-low">Low 4</span>
          <span className="text-green-500">Gas 5</span>
        </div>
      </div>
    </div>
  </div>
);

const demoMap: Record<string, JSX.Element> = {
  invariant: <InvariantDemo />,
  crossContract: <CrossContractDemo />,
  hunting: <HuntingDemo />,
  validation: <ValidationDemo />,
  agents: <AgentsDemo />,
  pipeline: <PipelineTimingDemo />,
  progress: <ProgressDemo />,
  container: <ContainerDemo />,
  dataLifecycle: <DataLifecycleDemo />,
  lineAccurate: <LineAccurateDemo />,
};

// ─── Finding showcase sub-component ────────────────────────────────────

const FindingShowcase = ({
  finding,
}: {
  finding: typeof knownFindings[0];
}) => {
  const style = severityStyles[finding.severity];
  return (
    <div className={cn(
      "border-l-2 rounded-lg bg-card/30 border border-border/10 overflow-hidden",
      style.border
    )}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded", style.badge)}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/30">
            {finding.file} · {finding.line}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">{finding.title}</p>
        {finding.expanded && (
          <>
            <p className="text-xs text-muted-foreground/50 mt-2 leading-relaxed">
              {finding.description}
            </p>
            <SolidityCodeBlock />
            {finding.remediation && (
              <div className="mt-3 border border-green-500/20 bg-green-500/5 rounded-lg p-3">
                <p className="text-[10px] font-mono text-green-400/70 mb-1">Remediation</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">{finding.remediation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CollapsedFinding = ({
  finding,
}: {
  finding: { severity: string; title: string; file: string; line: string };
}) => {
  const style = severityStyles[finding.severity];
  return (
    <div className={cn(
      "border-l-2 rounded-lg bg-card/30 border border-border/10 p-4 flex items-center gap-3",
      style.border
    )}>
      <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0", style.badge)}>
        {finding.severity}
      </span>
      <p className="text-sm font-medium text-foreground flex-1 line-clamp-1">{finding.title}</p>
      <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0 hidden sm:inline">
        {finding.file} · {finding.line}
      </span>
    </div>
  );
};

// ─── Page component ────────────────────────────────────────────────────

const Home = () => {
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const pipelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pipelineRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const start = viewH * 0.8;
        const end = -rect.height * 0.3;
        const raw = (start - rect.top) / (start - end);
        setPipelineProgress(Math.min(1, Math.max(0, raw)));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── SECTION 1: Hero ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-12 md:pt-40 md:pb-14">
        <HeroBackground />

        <div className="relative z-20 max-w-6xl mx-auto text-center px-5 md:px-6">
          <h1 className="mx-auto font-black leading-[1.15] tracking-tight text-center">
            <FitText as="span" max={88} min={22} className="block text-gradient">
              Smart Contract Security
            </FitText>
            <FitText as="span" max={88} min={22} className="block text-foreground">
              Reimagined with AI
            </FitText>
          </h1>

          <p className="text-[clamp(0.75rem,calc(0.6rem+0.7vw),1.125rem)] text-muted-foreground/70 mt-3 md:mt-8 max-w-xl mx-auto leading-relaxed">
            Multi-agent security engine that hunts vulnerabilities across your smart contracts — from known exploit patterns to protocol-specific logic flaws. Results in minutes, not weeks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button asChild variant="solarGlow" size="lg">
              <Link to="/login">Start Auditing</Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-muted-foreground/70 hover:text-foreground" onClick={scrollToHowItWorks}>
              See How It Works →
            </Button>
          </div>

        </div>

        <div className="relative z-20 mt-10 sm:mt-16 max-w-5xl mx-auto px-5 md:px-6">
          <DashboardAuditDemo />
        </div>

        <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 mt-6">
          {["Multi-Phase Analysis", "Robust Validation", "Line-Accurate Fixes"].map((pill) => (
            <span
              key={pill}
              className="bg-foreground/[0.03] border border-border/10 rounded-full px-3 py-1 text-[11px] font-mono text-muted-foreground/50"
            >
              {pill}
            </span>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: Capability Showcase ────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-5xl mx-auto px-5 md:px-6">
          <ScrollReveal>
            <FitText as="h2" max={56} min={19} className="text-center font-black tracking-tight leading-[1.15]">
              Why We're Different
            </FitText>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10 md:mt-14">
            {capabilities.map((cap, i) => (
              <ScrollReveal key={cap.title} delay={i * 100}>
                <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6 md:p-8 hover:border-primary/20 transition-colors h-full">
                  <h3 className="text-sm md:text-base font-semibold text-foreground mb-3">{cap.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground/60 leading-relaxed mb-5">{cap.copy}</p>
                  {demoMap[cap.demo]}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-3xl mx-auto px-5 md:px-6">
          <ScrollReveal>
            <div className="text-center">
              <FitText as="h2" max={56} min={19} className="font-black tracking-tight leading-[1.15]">
                Seven Phases. Zero Guesswork.
              </FitText>
              <p className="text-[clamp(0.7rem,calc(0.5rem+0.55vw),1rem)] text-muted-foreground/60 mt-3 md:mt-4 max-w-xl mx-auto">
                Every contract through the same structured pipeline
              </p>
            </div>
          </ScrollReveal>

          <div className="relative mt-8 md:mt-12" ref={pipelineRef}>
            <div className="space-y-5 md:space-y-8">
              {phases.map((phase, index) => {
                const Icon = phase.icon;
                const isLast = index === phases.length - 1;
                const threshold = index / phases.length;
                const isActive = pipelineProgress >= threshold;
                const nextThreshold = (index + 1) / phases.length;
                const isNextActive = pipelineProgress >= nextThreshold;
                return (
                  <div key={phase.pill} className="relative flex items-start gap-4 md:gap-8">
                    {!isLast && (
                      <div className="absolute left-6 md:left-8 top-6 md:top-8 w-px h-[calc(100%+1.25rem)] md:h-[calc(100%+2rem)] -translate-x-1/2 border-l border-dashed border-border/20" />
                    )}
                    {!isLast && (
                      <div
                        className="absolute left-6 md:left-8 top-6 md:top-8 w-px -translate-x-1/2 bg-primary transition-none"
                        style={{ height: isNextActive ? "calc(100% + 1.25rem)" : isActive ? "50%" : "0%" }}
                      />
                    )}
                    <div className={cn(
                      "relative z-10 flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full bg-card border flex items-center justify-center transition-colors duration-500",
                      isActive ? "border-primary/50" : "border-border/20"
                    )}>
                      <Icon className={cn("w-5 h-5 transition-colors duration-500", isActive ? "text-primary" : "text-muted-foreground/40")} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="terminal-pill">{phase.pill}</span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground/60 mt-1.5 leading-relaxed">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Findings Showcase ──────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-5 md:px-6">
          <ScrollReveal>
            <div className="text-center">
              <FitText as="h2" max={56} min={19} className="font-black tracking-tight leading-[1.15]">
                Real Exploits. Real Fixes.
              </FitText>
              <p className="text-[clamp(0.7rem,calc(0.5rem+0.55vw),1rem)] text-muted-foreground/60 mt-3 md:mt-4 max-w-lg mx-auto">
                From known attack patterns to protocol-specific logic flaws
              </p>
            </div>
          </ScrollReveal>

          {/* Known patterns */}
          <div className="mt-8 md:mt-10 rounded-2xl bg-foreground/[0.01] border border-border/10 p-5 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60">
                Known Vulnerability Patterns
              </p>
              <span className="text-[10px] font-mono text-primary/50 bg-primary/10 px-2 py-0.5 rounded-full">
                {knownFindings.length}
              </span>
            </div>
            <div className="space-y-3">
              {knownFindings.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 100}>
                  {f.expanded ? <FindingShowcase finding={f} /> : <CollapsedFinding finding={f} />}
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Protocol-specific */}
          <div className="mt-6 rounded-2xl bg-foreground/[0.01] border border-border/10 p-5 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60">
                Protocol-Specific Logic
              </p>
              <span className="text-[10px] font-mono text-primary/50 bg-primary/10 px-2 py-0.5 rounded-full">
                {protocolFindings.length}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/50 mb-6 text-center max-w-lg mx-auto">
              Beyond known patterns, Solarizer models your protocol's specific invariants — the accounting rules, epoch mechanics, and collateral assumptions unique to your codebase
            </p>
            <div className="space-y-3">
              {protocolFindings.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 100}>
                  <CollapsedFinding finding={f} />
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* QA & Gas */}
          <div className="mt-6 rounded-2xl bg-foreground/[0.01] border border-border/10 p-5 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60">
                QA & Gas Optimizations
              </p>
              <span className="text-[10px] font-mono text-primary/50 bg-primary/10 px-2 py-0.5 rounded-full">
                {qaFindings.length}
              </span>
            </div>
            <div className="space-y-3">
              {qaFindings.map((f, i) => (
                <ScrollReveal key={f.title} delay={i * 100}>
                  <CollapsedFinding finding={f} />
                </ScrollReveal>
              ))}
            </div>
          </div>

          <ScrollReveal delay={200}>
            <ScoreDemo />
          </ScrollReveal>
        </div>
      </section>

      {/* ── SECTION 6: Built Different ────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-5xl mx-auto px-5 md:px-6">
          <ScrollReveal>
            <FitText as="h2" max={56} min={19} className="text-center font-black tracking-tight leading-[1.15]">
              Engineered for Trust
            </FitText>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-10 md:mt-14">
            {builtDifferentFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} delay={i * 100}>
                  <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6 md:p-8 hover:border-primary/20 transition-colors h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="text-sm md:text-base font-semibold text-foreground">{feature.title}</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground/60 leading-relaxed mb-5 flex-1">
                      {feature.copy}
                    </p>
                    {demoMap[feature.demo]}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Final CTA ──────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center px-5 md:px-6">
            <h2 className="font-black tracking-tight leading-[1.15]">
              <FitText as="span" max={88} min={22} className="block text-gradient">AI-Powered Security</FitText>
              <FitText as="span" max={88} min={22} className="block mt-1 md:mt-2">Fraction of the Cost</FitText>
            </h2>

            <p className="text-[clamp(0.75rem,calc(0.6rem+0.7vw),1.125rem)] text-muted-foreground/60 mt-4 md:mt-6 max-w-lg mx-auto leading-relaxed">
              Multi-pass AI analysis, exploit-pattern matching, and line-accurate remediation — accessible to every team, at every stage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button asChild variant="solarGlow" size="lg">
                <Link to="/login">Start Auditing</Link>
              </Button>
              <Link to="/pricing" className="text-sm text-primary hover:underline">
                View Pricing →
              </Link>
            </div>

          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
