import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy, Check, Layers, Fingerprint, Search, GitBranch, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerminalAuditDemo from "@/components/TerminalAuditDemo";
import HeroBackground from "@/components/HeroBackground";

const phases = [
  {
    num: "01",
    pill: "Complexity Analysis",
    title: "Smart Scoping",
    icon: Layers,
    description:
      "Classifies each contract by complexity. Novel contracts trigger deeper second-pass analysis; simple ones route efficiently",
  },
  {
    num: "02",
    pill: "DNA Matching",
    title: "Exploit Intelligence",
    icon: Fingerprint,
    description:
      "Functions deconstructed into semantic queries against a vector index of exploit signatures from real post-mortems",
  },
  {
    num: "03",
    pill: "Contract Analysis",
    title: "Vulnerability Hunt",
    icon: Search,
    description:
      "Red team simulation per contract. Complex contracts receive a second pass to surface chained, multi-step exploits",
  },
  {
    num: "04",
    pill: "Cross-Contract Analysis",
    title: "Protocol-Wide Reasoning",
    icon: GitBranch,
    description:
      "Traces attack paths across contract boundaries — shared state corruption and inconsistent trust assumptions",
  },
  {
    num: "05",
    pill: "Report Generation",
    title: "Structured Findings",
    icon: FileText,
    description:
      "Reads original source to locate each finding, extract vulnerable code, and produce line-accurate remediation",
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

const FindingCard = ({ f }: { f: typeof knownFindings[0] }) => (
  <div className="rounded-xl border border-border/20 bg-card/20 p-6 hover:border-border/40 transition-colors">
    <div className="flex items-center justify-between">
      <span className={`${f.badgeClass} text-[11px] font-mono font-bold px-2.5 py-1 rounded-md`}>
        {f.severity}
      </span>
      <span className="text-[11px] font-mono text-muted-foreground/30">{f.file}</span>
    </div>
    <p className="text-base font-semibold text-foreground mt-3">{f.title}</p>
    <p className="text-sm text-muted-foreground/60 mt-2 leading-relaxed">{f.description}</p>
  </div>
);

const Home = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install -g solarizer");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── SECTION 1: Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-0 md:pt-36">
        <HeroBackground />

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h1 className="text-[clamp(2.4rem,6vw,5.5rem)] font-black leading-[1.05] tracking-tight text-foreground">
            Security for all
            <br />
            Accessible instantly
          </h1>

          <p className="text-lg text-muted-foreground/70 mt-5 max-w-lg mx-auto">
            Multi-phase security analysis for Solidity smart contracts.
            Point Solarizer at your code. Get a structured audit report in minutes.
          </p>
        </div>

        <div className="relative mt-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <TerminalAuditDemo />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── SECTION 2: Audit Pipeline ────────────────────────────────── */}
      <section id="pipeline" className="py-24 md:py-32 bg-background">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Five phases. Every contract
            </h2>
            <p className="text-base text-muted-foreground/60 mt-4 max-w-xl mx-auto">
              Each contract passes through a structured pipeline — from complexity classification to line-accurate remediation
            </p>
          </div>

          {/* Numbered vertical sequence */}
          <div className="relative mt-16">
            {/* Vertical connecting line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px border-l border-dashed border-border/20" />

            <div className="space-y-10">
              {phases.map((phase, i) => {
                const Icon = phase.icon;
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={phase.pill}
                    className={`relative flex items-start gap-6 md:gap-8 ${
                      isEven ? "" : "md:flex-row-reverse md:text-right"
                    }`}
                  >
                    {/* Number marker */}
                    <div className="relative z-10 flex-shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full bg-card border border-border/30 flex items-center justify-center">
                      <span className="text-lg md:text-xl font-black text-foreground/10 absolute">
                        {phase.num}
                      </span>
                      <Icon className="w-5 h-5 text-primary relative z-10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <span className="terminal-pill">{phase.pill}</span>
                      <h3 className="text-lg font-semibold text-foreground mt-1">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground/60 mt-1.5 leading-relaxed max-w-md">
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

      {/* ── SECTION 3: What It Finds ─────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Finds what matters
            </h2>
            <p className="text-base text-muted-foreground/60 mt-4 max-w-xl mx-auto">
              Known vulnerability classes and the logic issues specific to your protocol
            </p>
          </div>

          {/* Known patterns group */}
          <div className="mt-14 rounded-2xl bg-foreground/[0.01] border border-border/10 p-6 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">
                Known vulnerability patterns
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/30 bg-muted/40 px-2 py-0.5 rounded-full">
                {knownFindings.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {knownFindings.map((f) => (
                <FindingCard key={f.title} f={f} />
              ))}
            </div>
          </div>

          {/* Protocol-specific group */}
          <div className="mt-6 rounded-2xl bg-foreground/[0.01] border border-border/10 p-6 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">
                Protocol-specific logic
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/30 bg-muted/40 px-2 py-0.5 rounded-full">
                {protocolFindings.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground/50 mb-6 text-center max-w-lg mx-auto">
              Beyond known patterns, Solarizer models your protocol's specific
              invariants — the accounting rules, epoch mechanics, and collateral
              assumptions unique to your codebase
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {protocolFindings.map((f) => (
                <FindingCard key={f.title} f={f} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CTA ───────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Run your first audit
          </h2>

          <div className="mt-8 max-w-sm mx-auto border border-border/50 rounded-lg px-6 py-4 bg-card/50 font-mono text-sm flex items-center gap-2">
            <span className="text-muted-foreground/40">$</span>
            <span className="text-foreground/80 flex-1 text-left select-all">
              npm install -g solarizer
            </span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-5">
            <Button asChild variant="solarGlow">
              <Link to="/dashboard">
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
