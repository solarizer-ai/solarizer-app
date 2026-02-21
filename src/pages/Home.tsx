import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerminalAuditDemo from "@/components/TerminalAuditDemo";

const phases = [
  {
    pill: "Complexity Analysis",
    title: "Smart Scoping",
    description:
      "Classifies each contract as Standard, Complex DeFi, or Experimental. Complex and novel contracts trigger a deeper second-pass analysis; simple contracts are routed efficiently.",
  },
  {
    pill: "DNA Matching",
    title: "Exploit Intelligence",
    description:
      "Each function is deconstructed into semantic search statements and queried against the Vulnerability DNA Matrix — a vector index of exploit signatures from real protocol post-mortems.",
  },
  {
    pill: "Contract Analysis",
    title: "Vulnerability Hunt",
    description:
      "Red team simulation per contract: an initial aggressive pass targets high-confidence vulnerabilities. Complex contracts receive a second informed pass to surface chained, conditional, and multi-step exploits.",
  },
  {
    pill: "Cross-Contract Analysis",
    title: "Protocol-Wide Reasoning",
    description:
      "Traces attack paths that cross contract boundaries — multi-step exploits, shared state corruption, and inconsistent trust assumptions invisible to single-contract analysis.",
  },
  {
    pill: "Report Generation",
    title: "Structured Findings",
    description:
      "A dedicated formatting pass reads the original source to locate each finding, extract the vulnerable code block, and produce line-accurate, context-specific remediation.",
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

const FindingRow = ({ f }: { f: typeof knownFindings[0] }) => (
  <div className="py-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
    <span className={`${f.badgeClass} text-[10px] font-mono font-semibold px-2 py-0.5 rounded shrink-0 self-start`}>
      {f.severity}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{f.title}</p>
      <p className="text-sm text-muted-foreground/70 mt-1">{f.description}</p>
      <p className="text-xs font-mono text-muted-foreground/40 mt-2">{f.file}</p>
    </div>
  </div>
);

const Home = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install -g solarizer");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToPipeline = () => {
    document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── SECTION 1: Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-0 md:pt-36">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h1 className="text-[clamp(2.4rem,6vw,5.5rem)] font-black leading-[1.05] tracking-tight">
            <span className="text-gradient">Security for all.</span>
            <br />
            <span className="text-foreground">Accessible instantly.</span>
          </h1>

          <p className="text-lg text-muted-foreground/70 mt-5 max-w-lg mx-auto">
            Multi-phase security analysis for Solidity smart contracts.
            Point Solarizer at your code. Get a structured audit report in minutes.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button asChild variant="solarGlow" size="lg">
              <Link to="/dashboard">
                Start Auditing
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" onClick={scrollToPipeline}>
              See How It Works
            </Button>
          </div>
        </div>

        <div className="relative mt-16 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="absolute -inset-8 bg-primary/[0.06] blur-3xl rounded-[3rem] pointer-events-none" />
          <div className="relative">
            <TerminalAuditDemo />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── SECTION 2: Audit Pipeline ────────────────────────────────── */}
      <section id="pipeline" className="py-32 md:py-40 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Five phases.
            <br />
            Every contract.
          </h2>

          <div className="border-l border-border/30 pl-8 mt-12 space-y-0">
            {phases.map((phase) => (
              <div key={phase.pill} className="pb-10 last:pb-0">
                <span className="terminal-pill">{phase.pill}</span>
                <h3 className="text-base font-semibold text-foreground">{phase.title}</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: What It Finds ─────────────────────────────────── */}
      <section className="py-32 md:py-40 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Finds what matters.
          </h2>
          <p className="text-base text-muted-foreground/70 mt-4">
            Known vulnerability classes. And the logic issues specific to your protocol.
          </p>

          <p className="mt-12 mb-6 text-xs font-mono uppercase tracking-widest text-muted-foreground/35">
            Known vulnerability patterns
          </p>
          <div className="divide-y divide-border/20">
            {knownFindings.map((f) => (
              <FindingRow key={f.title} f={f} />
            ))}
          </div>

          <p className="mt-12 mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground/35">
            Protocol-specific logic
          </p>
          <p className="text-sm text-muted-foreground/50 mb-6">
            Beyond known patterns, Solarizer models your protocol's specific
            invariants — the accounting rules, epoch mechanics, and collateral
            assumptions unique to your codebase.
          </p>
          <div className="divide-y divide-border/20">
            {protocolFindings.map((f) => (
              <FindingRow key={f.title} f={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CTA ───────────────────────────────────────────── */}
      <section className="py-32 md:py-40 bg-background">
        <div className="max-w-xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Run your first audit.
          </h2>

          <div className="mt-8 max-w-xs mx-auto border border-border/50 rounded-lg px-4 py-3 bg-card/50 font-mono text-sm flex items-center gap-2">
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
