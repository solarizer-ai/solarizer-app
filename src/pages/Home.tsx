import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerminalAuditDemo from "@/components/TerminalAuditDemo";
import HeroBackground from "@/components/HeroBackground";
import { Button } from "@/components/ui/button";
import RealFindings from "@/components/home/RealFindings";
import DifferentiatorComparison from "@/components/home/DifferentiatorComparison";
import HowItWorks from "@/components/home/HowItWorks";
import SpeedPositioning from "@/components/home/SpeedPositioning";
import EngineExplanation from "@/components/home/EngineExplanation";
import TrustSignals from "@/components/home/TrustSignals";

const INSTALL_CMD = "curl -fsSL https://solarizer.io/install.sh | bash";

const Home = () => {
  const [copied, setCopied] = useState(false);
  const [ctaCopied, setCtaCopied] = useState(false);

  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── SECTION 1: Hero ─────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center">
        <HeroBackground />

        <div className="relative w-full max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20 pt-28 pb-12 md:pt-32 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black leading-[1.15] tracking-tight">
                <span className="block text-foreground">Smart Contract Security</span>
                <span className="block text-gradient mt-1 md:mt-2">Reimagined With AI</span>
              </h1>

              <div className="mt-6 md:mt-8 max-w-[520px]">
                <p className="text-base md:text-lg text-muted-foreground/70 leading-relaxed">
                  Detect real exploit paths in minutes — not weeks.
                </p>
                <p className="text-base md:text-lg text-muted-foreground/70 leading-relaxed mt-1">
                  Trace cross-contract attack flows and receive line-accurate fixes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                <Button asChild size="lg" className="h-[52px] text-base font-semibold px-8">
                  <Link to="/dashboard">Scan Your Protocol Now</Link>
                </Button>
                <Button asChild variant="solarGlow" size="lg" className="h-[52px] text-base font-semibold px-8">
                  <Link to="/docs">View Documentation</Link>
                </Button>
              </div>

              <p className="text-[13px] md:text-sm text-muted-foreground/50 mt-4 md:mt-5 font-mono">
                CLI-first · Works locally · No upload required
              </p>
            </div>

            {/* Right: Terminal */}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary/60 mb-3">
                Real Solarizer Analysis
              </p>
              <div className="h-[260px] sm:h-[300px] md:h-[420px] lg:h-[460px]">
                <TerminalAuditDemo />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Real Findings ───────────────────── */}
      <RealFindings />

      {/* ── SECTION 3: Differentiator ──────────────────── */}
      <DifferentiatorComparison />

      {/* ── SECTION 4: How It Works ────────────────────── */}
      <HowItWorks />

      {/* ── SECTION 5: Speed Positioning ───────────────── */}
      <SpeedPositioning />

      {/* ── SECTION 6: Engine Explanation ───────────────── */}
      <EngineExplanation />

      {/* ── SECTION 7: Trust Signals ───────────────────── */}
      <TrustSignals />

      {/* ── SECTION 8: CLI Install ─────────────────────── */}
      <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
        <div className="max-w-2xl mx-auto text-center px-5 md:px-8">
          <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15]">
            <span className="block">Secure your contracts</span>
            <span className="block text-gradient mt-1 md:mt-2">from your terminal</span>
          </h2>

          <div className="mt-8 max-w-lg mx-auto border border-border/50 rounded-xl px-5 py-4 bg-card/50 font-mono text-sm md:text-base flex items-center gap-2 hover:border-primary/30 transition-all">
            <span className="text-muted-foreground/40">$</span>
            <span className="text-foreground/80 flex-1 text-left select-all truncate">
              {INSTALL_CMD}
            </span>
            <button
              onClick={() => handleCopy(INSTALL_CMD, setCopied)}
              className="text-muted-foreground/40 hover:text-foreground transition-colors p-1 shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Link to="/docs" className="inline-block mt-5 text-sm text-primary hover:underline">
            View documentation →
          </Link>
        </div>
      </section>

      {/* ── SECTION 9: Final CTA ───────────────────────── */}
      <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
        <div className="max-w-2xl mx-auto text-center px-5 md:px-8">
          <h2 className="text-[26px] md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.2]">
            Don't ship exploitable contracts.
          </h2>

          <Button asChild size="lg" className="h-[54px] text-base font-semibold px-10 mt-8 w-full sm:w-auto">
            <Link to="/dashboard">Scan Your Protocol Now</Link>
          </Button>

          <p className="text-[13px] text-muted-foreground/50 mt-5 font-mono">
            Free scan available · Works locally · No upload required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
