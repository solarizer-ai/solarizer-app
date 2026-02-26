import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Search,
  GitBranch,
  FileText,
  Shield,
  EyeOff,
  Workflow,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardAuditDemo from "@/components/DashboardAuditDemo";
import HeroBackground from "@/components/HeroBackground";
import { cn } from "@/lib/utils";

// ─── Data ──────────────────────────────────────────────────────────────────

const phases = [
  {
    num: "01",
    pill: "Smart Scoping",
    title: "Complexity Classification",
    icon: Layers,
    description:
      "Each contract is classified by complexity tier to route analysis depth intelligently — simple contracts move fast, novel mechanisms trigger deeper passes.",
  },
  {
    num: "02",
    pill: "Pattern Intelligence",
    title: "Exploit Signature Matching",
    icon: Search,
    description:
      "Every function matched against a curated database of real-world exploit signatures sourced from post-mortems across hundreds of protocol hacks.",
  },
  {
    num: "03",
    pill: "Vulnerability Hunting",
    title: "Multi-Pass Red Team",
    icon: Shield,
    description:
      "Red team simulation per contract. Complex contracts receive deeper analysis to surface chained, multi-step exploits that single-pass tools miss entirely.",
  },
  {
    num: "04",
    pill: "Protocol-Wide Reasoning",
    title: "Cross-Contract Analysis",
    icon: GitBranch,
    description:
      "Attack paths traced across contract boundaries — shared state corruption, inconsistent trust assumptions, and callback ordering vulnerabilities.",
  },
  {
    num: "05",
    pill: "Structured Reporting",
    title: "Line-Accurate Remediation",
    icon: FileText,
    description:
      "Each finding references the original source: contract name, line number, vulnerable code snippet, severity, impact, and actionable fix guidance.",
  },
];

const knownFindings = [
  {
    severity: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400",
    title: "Read-only reentrancy via getPricePerShare()",
    description:
      "getPricePerShare() reads totalAssets() during an active withdrawal. An attacker exploits this stale mid-callback value to inflate collateral valuation in a dependent lending protocol.",
    file: "Vault.sol · line 334",
  },
  {
    severity: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400",
    title: "Fee-on-transfer token insolvency in deposit()",
    description:
      "Protocol records msg.value as deposited without measuring the actual received balance. Recorded liability grows faster than real holdings.",
    file: "DepositHandler.sol · line 89",
  },
  {
    severity: "MEDIUM",
    badgeClass: "bg-yellow-500/10 text-yellow-500",
    title: "TWAP window insufficient for low-liquidity pairs",
    description:
      "15-minute window allows single-block price manipulation on thin markets, affecting liquidations, collateral checks, and rebalances.",
    file: "PriceOracle.sol · line 211",
  },
];

const protocolFindings = [
  {
    severity: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400",
    title: "Epoch boundary reward over-distribution",
    description:
      "Users entering the final block of an epoch receive a full allocation. Combined with rebasing, repeated entry-exit systematically drains the rewards reserve across consecutive cycles.",
    file: "RewardVault.sol · line 298",
  },
  {
    severity: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400",
    title: "Liquidation threshold bypass via callback ordering",
    description:
      "The collateral ratio check in liquidate() fires after the external repayment call. An attacker re-enters addCollateral() mid-liquidation to inflate their ratio and exit without penalty.",
    file: "LendingCore.sol · line 167",
  },
];

const comparisons = [
  { label: "Turnaround",   old: "2–6 weeks",                   solarizer: "Minutes to results"            },
  { label: "Cost",         old: "$50K–$500K per engagement",    solarizer: "From $149/month"               },
  { label: "Coverage",     old: "One-shot, point-in-time",      solarizer: "Continuous, every commit"      },
  { label: "Analysis",     old: "1–2 auditors, human bias",     solarizer: "Multi-agent AI ensemble"       },
  { label: "Findings",     old: "Report in 30 days",            solarizer: "Real-time as detected"         },
  { label: "Re-audits",    old: "Full engagement again",        solarizer: "Re-run in one click"           },
];

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Multi-Agent Analysis",
    description:
      "Not a single model guessing. A coordinated ensemble of specialized AI agents — each purpose-built for a different class of vulnerability. Findings are cross-validated before they reach you.",
    illustration: "agents",
  },
  {
    icon: EyeOff,
    title: "Your Code, Your Control",
    description:
      "Source code is never stored beyond your active session. No training on your codebase. When the audit ends, everything is destroyed. Zero residual risk.",
    illustration: "ephemeral",
  },
  {
    icon: Workflow,
    title: "Deterministic Pipeline",
    description:
      "Every audit follows the same structured multi-phase workflow. Reproducible results. No randomness. No 'prompt and pray'. Same engine, same depth, every time.",
    illustration: "pipeline",
  },
  {
    icon: Monitor,
    title: "Dashboard + CLI",
    description:
      "Upload from the dashboard or run from your terminal. Full flexibility — same engine, same depth, same results. One subscription, two interfaces.",
    illustration: "interfaces",
  },
];

const severityBorder: Record<string, string> = {
  CRITICAL: "border-red-500/30",
  HIGH:     "border-orange-500/30",
  MEDIUM:   "border-yellow-500/30",
};

// ─── Sub-components ────────────────────────────────────────────────────────

const FindingCard = ({ f }: { f: typeof knownFindings[0] }) => (
  <div className={`rounded-[14px] border bg-card/20 p-5 sm:p-6 hover:border-opacity-60 transition-colors ${severityBorder[f.severity] || "border-border/20"}`}>
    <div className="space-y-2">
      <span className={`${f.badgeClass} text-[11px] font-mono font-bold px-2.5 py-1 rounded-md`}>
        {f.severity}
      </span>
      <p className="text-[11px] font-mono text-muted-foreground/30">{f.file}</p>
    </div>
    <p className="text-sm font-semibold text-foreground mt-3">{f.title}</p>
    <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">{f.description}</p>
  </div>
);

const AgentsIllustration = () => (
  <div className="flex flex-col items-center gap-3 py-4">
    <div className="flex gap-3">
      {["Scope", "Pattern", "Exploit", "Report"].map((label) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary/60" />
          </div>
          <span className="text-[9px] text-muted-foreground/50">{label}</span>
        </div>
      ))}
    </div>
    <span className="text-[9px] text-muted-foreground/30 mt-1">
      4 specialized agents · cross-validated
    </span>
  </div>
);

const EphemeralIllustration = () => (
  <div className="flex flex-col gap-2 py-4 font-mono text-[10px]">
    <div className="flex items-center gap-2 text-muted-foreground/40">
      <span className="text-muted-foreground/20">session.log</span>
      <span className="text-success/60">✓ destroyed</span>
    </div>
    <div className="flex items-center gap-2 text-muted-foreground/40">
      <span className="text-muted-foreground/20">source/</span>
      <span className="text-success/60">✓ purged</span>
    </div>
    <div className="mt-1 text-[9px] text-muted-foreground/30">
      0 bytes retained after session
    </div>
  </div>
);

const PipelineIllustration = () => (
  <div className="flex flex-col gap-1.5 py-4 font-mono text-[10px]">
    {[
      { label: "Scoping",    time: "4s"      },
      { label: "Analysis",   time: "2m 18s"  },
      { label: "Validation", time: "34s"     },
      { label: "Reporting",  time: "12s"     },
    ].map((item) => (
      <div key={item.label} className="flex items-center gap-2 text-muted-foreground/40">
        <span className="text-success/60">✓</span>
        <span className="flex-1">{item.label}</span>
        <span className="text-muted-foreground/25">{item.time}</span>
      </div>
    ))}
  </div>
);

const InterfacesIllustration = () => (
  <div className="grid grid-cols-2 gap-3 py-4">
    <div className="rounded-lg border border-border/20 p-2.5">
      <p className="text-[9px] text-muted-foreground/40 mb-1.5">Dashboard</p>
      <div className="space-y-1">
        <div className="h-1.5 rounded bg-primary/15 w-full" />
        <div className="h-1.5 rounded bg-primary/10 w-3/4" />
        <div className="h-1.5 rounded bg-primary/5 w-1/2" />
      </div>
    </div>
    <div className="rounded-lg border border-border/20 p-2.5">
      <p className="text-[9px] text-muted-foreground/40 mb-1.5">$ solarizer</p>
      <div className="space-y-1">
        <div className="h-1.5 rounded bg-success/15 w-full" />
        <div className="h-1.5 rounded bg-success/10 w-4/5" />
        <div className="h-1.5 rounded bg-success/5 w-3/5" />
      </div>
    </div>
  </div>
);

const illustrationMap: Record<string, JSX.Element> = {
  agents:     <AgentsIllustration />,
  ephemeral:  <EphemeralIllustration />,
  pipeline:   <PipelineIllustration />,
  interfaces: <InterfacesIllustration />,
};

// ─── Page component ────────────────────────────────────────────────────────

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── SECTION 1: Hero ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-12 md:pt-40 md:pb-14">
        <HeroBackground />

        <div className="relative max-w-4xl mx-auto text-center px-5 md:px-6">
          <h1 className="w-fit mx-auto text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.15] tracking-tight">
            <span className="block whitespace-nowrap text-foreground">Enterprise-Grade Security</span>
            <span className="block whitespace-nowrap text-gradient mt-1 md:mt-2">Accessible To All</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground/70 mt-4 md:mt-8 max-w-lg mx-auto leading-relaxed">
            AI-powered smart contract audits that find real exploit paths in minutes — not weeks.
            At a fraction of the cost.
          </p>

          <p className="text-[13px] text-muted-foreground/50 mt-3.5 md:mt-4 tracking-wide">
            Trusted by teams auditing 50+ protocols · 2M+ nLOC analyzed
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 md:mt-8">
            <Button asChild variant="solarGlow" size="lg">
              <Link to="/signup">Start Auditing</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-10 sm:mt-16 max-w-5xl mx-auto px-5 md:px-6">
          <DashboardAuditDemo />
        </div>
      </section>

      {/* ── SECTION 2: Paradigm Shift ─────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-3xl mx-auto px-5 md:px-6">
          {/* Pull quote */}
          <blockquote className="text-center mb-10 md:mb-14">
            <p className="text-[clamp(1.2rem,3vw,2rem)] font-black leading-snug">
              <span className="text-gradient">AI dropped the barrier for attackers.</span>
              <br />
              <span className="text-foreground/90">Security had to catch up.</span>
            </p>
          </blockquote>

          {/* Editorial body */}
          <div className="space-y-5 text-sm md:text-base text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto">
            <p>
              In 2020, you could argue that automated code analysis wasn't worth the friction.
              Attacks were human-paced. A motivated attacker needed deep expertise, weeks of
              analysis, and domain knowledge that took years to build.
            </p>
            <p>
              That changed when large language models arrived. The analysis that once required a
              senior researcher — cross-contract reasoning, identifying protocol-specific invariant
              violations, chaining multi-step exploits — can now be accelerated by anyone with
              access to an API. The sophistication of attacks hasn't decreased. The barrier to
              launching them has.
            </p>
            <p>
              Static analysis tools that flag well-known patterns aren't enough anymore. Protocols
              need AI that was purpose-built for security — not generic tooling adapted for it.
              AI-native security is no longer a differentiator. It's table stakes.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-10 md:mt-14 max-w-xl mx-auto">
            {[
              { value: "$2.8B",    label: "Lost to DeFi exploits in 2024"            },
              { value: "72%",      label: "Critical findings match known patterns"    },
              { value: "14 days",  label: "Avg. time-to-exploit post-disclosure"      },
            ].map(stat => (
              <div key={stat.value} className="text-center">
                <p className="text-xl md:text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground/40 mt-1 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Comparison ─────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-5 md:px-6">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
              <span className="text-gradient">Traditional Audits</span>
              <br />
              <span className="text-foreground">Weren't Built For This</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Old way */}
            <div className="rounded-2xl border border-border/20 p-5 md:p-8">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/30 mb-6">
                Traditional Audit
              </p>
              <div className="space-y-4">
                {comparisons.map(c => (
                  <div key={c.label} className="flex items-start gap-3">
                    <span className="text-muted-foreground/20 text-sm mt-0.5">✗</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/50">{c.label}</p>
                      <p className="text-xs text-muted-foreground/30">{c.old}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solarizer */}
            <div className="rounded-2xl border border-primary/25 p-5 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
              <p className="relative text-xs font-mono uppercase tracking-widest text-primary/60 mb-6">
                Solarizer
              </p>
              <div className="relative space-y-4">
                {comparisons.map(c => (
                  <div key={c.label} className="flex items-start gap-3">
                    <span className="text-success text-sm mt-0.5">✓</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground/60">{c.solarizer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: Findings ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-4xl mx-auto px-5 md:px-6">
          <div className="text-center">
            <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
              From <span className="text-gradient">known exploits</span> to{" "}
              <span className="text-gradient">protocol-specific logic</span>
            </h2>
          </div>

          {/* Known patterns */}
          <div className="mt-8 md:mt-10 rounded-2xl bg-foreground/[0.01] border border-border/10 p-4 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60">
                Known vulnerability patterns
              </p>
              <span className="text-[10px] font-mono text-primary/50 bg-primary/10 px-2 py-0.5 rounded-full">
                {knownFindings.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {knownFindings.map(f => <FindingCard key={f.title} f={f} />)}
            </div>
          </div>

          {/* Protocol-specific */}
          <div className="mt-6 rounded-2xl bg-foreground/[0.01] border border-border/10 p-4 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60">
                Protocol-specific logic
              </p>
              <span className="text-[10px] font-mono text-primary/50 bg-primary/10 px-2 py-0.5 rounded-full">
                {protocolFindings.length}
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground/50 mb-6 text-center max-w-lg mx-auto">
              Beyond known patterns, Solarizer models your protocol's specific
              invariants — the accounting rules, epoch mechanics, and collateral
              assumptions unique to your codebase
            </p>
            <div className="grid grid-cols-1 gap-4">
              {protocolFindings.map(f => <FindingCard key={f.title} f={f} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: Intelligence Engine (Pipeline) ─────────────────── */}
      <section id="pipeline" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-6">
          <div className="text-center">
            <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight whitespace-nowrap leading-[1.15]">
              Intelligence Engine
            </h2>
            <p className="text-xs md:text-base text-muted-foreground/60 mt-4 max-w-xl mx-auto">
              Each contract passes through a structured pipeline — from complexity classification
              to line-accurate remediation
            </p>
          </div>

          <div className="relative mt-8 md:mt-12" ref={pipelineRef}>
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px border-l border-dashed border-border/20" />
            <div
              className="absolute left-6 md:left-8 top-0 w-px bg-primary transition-none"
              style={{ height: `${pipelineProgress * 100}%` }}
            />
            <div className="space-y-5 md:space-y-8">
              {phases.map((phase, index) => {
                const Icon = phase.icon;
                const threshold = index / phases.length;
                const isActive = pipelineProgress >= threshold;
                return (
                  <div key={phase.pill} className="relative flex items-start gap-4 md:gap-8">
                    <div className={cn(
                      "relative z-10 flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full bg-card border flex items-center justify-center transition-colors duration-500",
                      isActive ? "border-primary/50" : "border-border/20"
                    )}>
                      <Icon className={cn("w-5 h-5 transition-colors duration-500", isActive ? "text-primary" : "text-muted-foreground/40")} />
                    </div>
                    <div className="flex-1 pt-1">
                      <span className="terminal-pill">{phase.pill}</span>
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

      {/* ── SECTION 6: Built For Enterprise ──────────────────────────── */}
      <section className="py-16 md:py-24 bg-[#030303]">
        <div className="max-w-4xl mx-auto px-5 md:px-6">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
              <span className="text-gradient">Built For Enterprise</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {enterpriseFeatures.map(feature => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl md:rounded-2xl bg-foreground/[0.01] border border-border/10 p-5 md:p-8 hover:border-primary/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <p className="text-sm md:text-base font-semibold text-foreground">{feature.title}</p>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-4 rounded-lg bg-[hsl(0_0%_4%)] border border-border/10 px-4">
                    {illustrationMap[feature.illustration]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: CTA ────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center px-5 md:px-6">
          <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
            <span className="block">Enterprise Security</span>
            <span className="block text-gradient mt-1 md:mt-2">Without The Enterprise Price Tag</span>
          </h2>

          <p className="text-sm md:text-lg text-muted-foreground/60 mt-6 max-w-lg mx-auto leading-relaxed">
            Multi-pass AI analysis, exploit-pattern matching, and line-accurate
            remediation — accessible to every team, at every stage.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button asChild variant="solarGlow" size="lg">
              <Link to="/signup">Start Auditing</Link>
            </Button>
            <Link to="/pricing" className="text-sm text-primary hover:underline">
              View Pricing →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
