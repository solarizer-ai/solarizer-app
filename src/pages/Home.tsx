import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerminalAuditDemo from "@/components/TerminalAuditDemo";
import HeroBackground from "@/components/HeroBackground";
import RealFindings from "@/components/home/RealFindings";
import DifferentiatorComparison from "@/components/home/DifferentiatorComparison";
import HowItWorks from "@/components/home/HowItWorks";
import SpeedPositioning from "@/components/home/SpeedPositioning";
import EngineExplanation from "@/components/home/EngineExplanation";
import TrustSignals from "@/components/home/TrustSignals";

const INSTALL_CMD = "curl -fsSL https://solarizer.io/install.sh | bash";

const Home = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Section 1: Hero ──────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center">
        <HeroBackground />

        <div className="relative w-full max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20 pt-[72px] pb-12 md:pt-28 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.15] tracking-tight">
                <span className="block text-foreground">Smart Contract Security</span>
                <span className="block text-gradient mt-1 md:mt-2">Reimagined With AI</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground/70 mt-6 md:mt-8 max-w-[520px] leading-relaxed">
                Detect real exploit paths in minutes — not weeks.
                Trace cross-contract attack flows and receive line-accurate fixes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                <Button asChild size="lg" className="h-[52px] sm:h-12 text-base font-semibold px-8">
                  <Link to="/dashboard">Scan Your Protocol Now</Link>
                </Button>
                <Button asChild variant="solarGlow" size="lg" className="h-[52px] sm:h-12 text-base font-semibold px-8">
                  <Link to="/docs">View Documentation</Link>
                </Button>
              </div>

              <p className="text-[13px] text-muted-foreground/50 mt-4">
                CLI-first · Works locally · No upload required
              </p>
            </div>

            {/* Right: Terminal */}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60 mb-3">
                Real Solarizer output
              </p>
              <div className="h-[260px] sm:h-[300px] md:h-[420px] lg:h-[460px]">
                <TerminalAuditDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Real Findings ─────────────────────────────── */}
      <RealFindings />

      {/* ── Section 3: Differentiator ────────────────────────────── */}
      <DifferentiatorComparison />

      {/* ── Section 4: How It Works ──────────────────────────────── */}
      <HowItWorks />

      {/* ── Section 5: Speed Positioning ─────────────────────────── */}
      <SpeedPositioning />

      {/* ── Section 6: Engine Explanation ─────────────────────────── */}
      <EngineExplanation />

      {/* ── Section 7: Trust Signals ─────────────────────────────── */}
      <TrustSignals />

      {/* ── Section 8: CLI Install ───────────────────────────────── */}
      <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
        <div className="max-w-2xl mx-auto text-center px-5 md:px-8">
          <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
            <span className="block">Secure your contracts</span>
            <span className="block text-gradient mt-1 md:mt-2">from your terminal</span>
          </h2>

          <div className="mt-8 max-w-md mx-auto border border-border/50 rounded-xl px-5 py-4 bg-card/50 font-mono text-sm flex items-center gap-2 hover:border-primary/30 transition-all">
            <span className="text-muted-foreground/40">$</span>
            <span className="text-foreground/80 flex-1 text-left select-all truncate">
              {INSTALL_CMD}
            </span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Link to="/docs" className="inline-block mt-5 text-sm text-primary hover:underline">
            View documentation →
          </Link>
        </div>
      </section>

      {/* ── Section 9: Final CTA ─────────────────────────────────── */}
      <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
        <div className="max-w-2xl mx-auto text-center px-5 md:px-8">
          <h2 className="text-[26px] md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.2]">
            Don't ship exploitable contracts.
          </h2>

          <Button asChild size="lg" className="mt-6 h-[54px] md:h-[52px] text-base font-semibold px-10 w-full sm:w-auto">
            <Link to="/dashboard">Scan Your Protocol Now</Link>
          </Button>

          <p className="text-[13px] text-muted-foreground/50 mt-4">
            Free scan available · Works locally · No upload required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
