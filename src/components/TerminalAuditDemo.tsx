import { useState, useEffect, useRef } from "react";

const SPINNER_CHARS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const FRAME_DELAYS = [1200, 1500, 1000, 2500, 2500, 2000, 2500, 2000, 2000, 1500, 1500, 1500, 1500];

type PhaseStatus = "done" | "active" | "pending";

interface Phase {
  label: string;
  status: PhaseStatus;
  elapsed?: string;
}

interface SubPhase {
  label: string;
  status: PhaseStatus;
  elapsed?: string;
}

interface Contract {
  name: string;
  complexity: string;
  status: PhaseStatus;
  findings?: number;
  elapsed?: string;
  activeLabel?: string;
  progress?: string;
  subPhases?: SubPhase[];
}

interface FindingGroup {
  severity: string;
  colorClass: string;
  count: number;
  titles: string[];
}

interface FrameState {
  phases: Phase[];
  contracts: Contract[];
  findings: FindingGroup[];
  elapsedTotal: number;
  complete?: boolean;
}

const basePhases: Phase[] = [
  { label: "Complexity Analysis", status: "pending" },
  { label: "Session Start", status: "pending" },
  { label: "Hunting (0/4)", status: "pending" },
  { label: "Cross-Contract", status: "pending" },
  { label: "Validation", status: "pending" },
  { label: "QA Scan", status: "pending" },
  { label: "Formatting", status: "pending" },
  { label: "Report Generation", status: "pending" },
];

const baseContracts: Contract[] = [
  { name: "Vault.sol", complexity: "L2", status: "pending", subPhases: [
    { label: "DNA Matching", status: "pending" },
    { label: "Initial Scan", status: "pending" },
    { label: "Deep Scan", status: "pending" },
  ]},
  { name: "LendingCore.sol", complexity: "L2", status: "pending", subPhases: [
    { label: "DNA Matching", status: "pending" },
    { label: "Initial Scan", status: "pending" },
    { label: "Deep Scan", status: "pending" },
  ]},
  { name: "PriceOracle.sol", complexity: "L1", status: "pending", subPhases: [
    { label: "DNA Matching", status: "pending" },
    { label: "Initial Scan", status: "pending" },
  ]},
  { name: "RewardVault.sol", complexity: "L2", status: "pending", subPhases: [
    { label: "DNA Matching", status: "pending" },
    { label: "Initial Scan", status: "pending" },
    { label: "Deep Scan", status: "pending" },
  ]},
];

function buildFrame(idx: number): FrameState {
  const p = basePhases.map(ph => ({ ...ph }));
  const c = baseContracts.map(ct => ({ ...ct, subPhases: ct.subPhases?.map(sp => ({ ...sp })) }));
  const f: FindingGroup[] = [];

  if (idx === 0) return { phases: p, contracts: c, findings: f, elapsedTotal: 0 };

  if (idx >= 1) { p[0].status = "active"; }
  if (idx >= 2) { p[0].status = "done"; p[0].elapsed = "4s"; p[1].status = "active"; }
  if (idx >= 3) {
    p[1].status = "done"; p[1].elapsed = "2s";
    p[2].status = "active"; p[2].label = "Hunting (1/4)";
    c[0].status = "active"; c[0].activeLabel = "DNA Matching";
    c[0].subPhases![0].status = "active";
  }
  if (idx >= 4) {
    c[0].subPhases![0].status = "done"; c[0].subPhases![0].elapsed = "11s";
    c[0].subPhases![1].status = "active";
    c[0].activeLabel = "Initial Scan";
  }
  if (idx >= 5) {
    c[0].subPhases![1].status = "done"; c[0].subPhases![1].elapsed = "22s";
    c[0].subPhases![2].status = "active";
    c[0].activeLabel = "Deep Scan";
    f.push({ severity: "CRITICAL", colorClass: "text-critical", count: 1, titles: ["Read-only reentrancy via getPricePerShare()"] });
  }
  if (idx >= 6) {
    c[0].status = "done"; c[0].findings = 2; c[0].elapsed = "56s";
    c[0].subPhases![2].status = "done"; c[0].subPhases![2].elapsed = "23s";
    c[1].status = "active"; c[1].activeLabel = "Initial Scan";
    c[1].subPhases![0].status = "done"; c[1].subPhases![0].elapsed = "9s";
    c[1].subPhases![1].status = "active";
    p[2].label = "Hunting (2/4)";
    f[0].count = 1;
    f.push({ severity: "HIGH", colorClass: "text-destructive", count: 1, titles: ["Fee-on-transfer token insolvency in deposit()"] });
  }
  if (idx >= 7) {
    c[1].status = "done"; c[1].findings = 2; c[1].elapsed = "48s";
    c[1].subPhases![1].status = "done"; c[1].subPhases![1].elapsed = "18s";
    c[1].subPhases![2].status = "done"; c[1].subPhases![2].elapsed = "21s";
    c[2].status = "active"; c[2].activeLabel = "Initial Scan";
    c[2].subPhases![0].status = "done"; c[2].subPhases![0].elapsed = "7s";
    c[2].subPhases![1].status = "active";
    p[2].label = "Hunting (3/4)";
    f[1].count = 2;
    f[1].titles.push("Liquidation threshold bypass via callback ordering");
    f.push({ severity: "MEDIUM", colorClass: "text-warning", count: 1, titles: ["TWAP window insufficient for low-liquidity pairs"] });
  }
  if (idx >= 8) {
    c[2].status = "done"; c[2].findings = 1; c[2].elapsed = "31s";
    c[2].subPhases![1].status = "done"; c[2].subPhases![1].elapsed = "14s";
    c[3].status = "done"; c[3].findings = 1; c[3].elapsed = "42s";
    c[3].subPhases!.forEach(sp => { sp.status = "done"; sp.elapsed = "12s"; });
    p[2].status = "done"; p[2].elapsed = "177s"; p[2].label = "Hunting (4/4)";
    p[3].status = "active";
    f[0].titles.push("Epoch boundary reward over-distribution");
    f[0].count = 2;
  }
  if (idx >= 9) {
    p[3].status = "done"; p[3].elapsed = "18s";
    p[4].status = "active";
  }
  if (idx >= 10) {
    p[4].status = "done"; p[4].elapsed = "12s";
    p[5].status = "active";
  }
  if (idx >= 11) {
    p[5].status = "done"; p[5].elapsed = "8s";
    p[6].status = "active";
  }
  if (idx >= 12) {
    p[6].status = "done"; p[6].elapsed = "3s";
    p[7].status = "active";
  }
  if (idx >= 13) {
    p[7].status = "done"; p[7].elapsed = "5s";
  }

  const elapsed = [0, 4, 6, 8, 19, 41, 63, 111, 153, 171, 183, 191, 194][Math.min(idx, 12)] || 0;
  return { phases: p, contracts: c, findings: f, elapsedTotal: elapsed, complete: idx >= 13 };
}

const TOTAL_FRAMES = 13;

const TerminalAuditDemo = () => {
  const [frame, setFrame] = useState(0);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [tickOffset, setTickOffset] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Frame advancement
  useEffect(() => {
    if (frame >= TOTAL_FRAMES) return;
    const delay = FRAME_DELAYS[frame];
    timerRef.current = setTimeout(() => {
      setFrame(f => f + 1);
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [frame]);

  // Spinner
  useEffect(() => {
    const iv = setInterval(() => setSpinnerIdx(i => (i + 1) % SPINNER_CHARS.length), 80);
    return () => clearInterval(iv);
  }, []);

  // Elapsed tick
  useEffect(() => {
    if (frame >= TOTAL_FRAMES) return;
    const iv = setInterval(() => setTickOffset(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [frame]);

  const state = buildFrame(frame);
  const spinner = SPINNER_CHARS[spinnerIdx];
  const elapsed = state.elapsedTotal + tickOffset;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const Marker = ({ status }: { status: PhaseStatus }) => {
    if (status === "done") return <span className="text-green-400">✓</span>;
    if (status === "active") return <span className="text-primary font-bold">»</span>;
    return <span className="text-muted-foreground/40">☐</span>;
  };

  return (
    <div className="rounded-xl md:rounded-2xl ring-1 ring-white/[0.05] overflow-hidden">
      {/* Title bar */}
      <div className="h-8 bg-[#0f0f0f] flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
        </div>
        <span className="flex-1 text-center text-[11px] font-mono text-muted-foreground/40">
          solarizer — audit
        </span>
      </div>

      {/* Body */}
      <div className="bg-[#050505] p-4 md:p-5 font-mono text-[10.5px] sm:text-[11px] md:text-[13px] leading-[1.5] sm:leading-[1.7] text-muted-foreground/70 overflow-hidden select-none h-[300px] sm:h-[420px] md:h-[480px]">
        {/* Audit header */}
        <div className="text-muted-foreground/40">
          ── Security Audit: VaultProtocol ────────────────
        </div>
        <div className="ml-2 text-muted-foreground/50">
          Scope: 4 contracts · 2,847 nLOC · {timeStr}
        </div>

        {/* Phases */}
        <div className="mt-3 space-y-0">
          {state.phases.map((ph) => (
            <div key={ph.label} className="ml-2 flex items-center gap-2">
              <Marker status={ph.status} />
              <span className={ph.status === "active" ? "text-primary font-semibold" : ""}>
                {ph.label}
              </span>
              {ph.status === "active" && <span className="text-primary">{spinner}</span>}
              {ph.elapsed && <span className="text-muted-foreground/30 ml-auto">{ph.elapsed}</span>}
            </div>
          ))}
        </div>

        {/* Contracts */}
        <div className="mt-4 text-muted-foreground/40">
          ── Contracts ────────────────────────────────────
        </div>
        <div className="mt-1 space-y-1">
          {state.contracts.map((ct) => (
            <div key={ct.name}>
              {ct.status === "done" ? (
                <div className="ml-2 flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-foreground/80">{ct.name}</span>
                  <span className="text-muted-foreground/30">{ct.complexity}</span>
                  <span className="text-muted-foreground/30">{ct.findings} findings</span>
                  <span className="text-muted-foreground/30 ml-auto">{ct.elapsed}</span>
                </div>
              ) : ct.status === "active" ? (
                <div>
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-primary font-bold">»</span>
                    <span className="text-primary font-semibold">{ct.name}</span>
                    <span className="text-muted-foreground/30">{ct.complexity}</span>
                    <span className="text-muted-foreground/40">▸ {ct.activeLabel}</span>
                  </div>
                  {ct.subPhases?.map((sp, i) => {
                    const isLast = i === ct.subPhases!.length - 1;
                    const connector = isLast ? "└" : "├";
                    return (
                      <div key={sp.label} className="ml-4 sm:ml-8 flex items-center gap-2">
                        <span className="text-muted-foreground/20">{connector}</span>
                        <Marker status={sp.status} />
                        <span className={sp.status === "active" ? "text-primary" : ""}>
                          {sp.label}
                        </span>
                        {sp.status === "active" && <span className="text-primary">{spinner}</span>}
                        {sp.elapsed && <span className="text-muted-foreground/30">{sp.elapsed}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <div className="ml-2 flex items-center gap-2">
                    <span className="text-muted-foreground/40">☐</span>
                    <span>{ct.name}</span>
                    <span className="text-muted-foreground/30">{ct.complexity}</span>
                    <span className="text-muted-foreground/30">pending</span>
                  </div>
                  {ct.subPhases?.map((sp, i) => {
                    const isLast = i === ct.subPhases!.length - 1;
                    const connector = isLast ? "└" : "├";
                    return (
                      <div key={sp.label} className="ml-4 sm:ml-8 flex items-center gap-2">
                        <span className="text-muted-foreground/20">{connector}</span>
                        <span className="text-muted-foreground/40">☐</span>
                        <span>{sp.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Findings */}
        {state.findings.length > 0 && (
          <>
            <div className="mt-4 text-muted-foreground/40">
              ── Findings ─────────────────────────────────────
            </div>
            <div className="mt-1 space-y-1">
              {state.findings.map((fg) => (
                <div key={fg.severity}>
                  <div className={`ml-2 ${fg.colorClass}`}>
                    {fg.severity} ({fg.count})
                  </div>
                  {fg.titles.map((t, i) => {
                    const isLast = i === fg.titles.length - 1;
                    return (
                      <div key={i} className="ml-4 flex items-center gap-2">
                        <span className="text-muted-foreground/20">{isLast ? "└" : "├"}</span>
                        <span className="text-muted-foreground/50">{t}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Completion message */}
        {state.complete && (
          <div className="mt-4 text-green-400 font-semibold">
            ✓ Audit complete — report saved to ./audit-report.md
          </div>
        )}

        {/* Footer */}
        {!state.complete && (
          <div className="mt-4 text-right text-muted-foreground/20 text-[10px]">
            esc to cancel
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalAuditDemo;
