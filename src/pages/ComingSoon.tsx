import { Shield, Search, GitBranch, BarChart3 } from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";
import HeroBackground from "@/components/HeroBackground";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Search,
    title: "Multi-Pass Vulnerability Hunting",
    description: "Deep iterative analysis that catches what single-pass scanners miss.",
  },
  {
    icon: GitBranch,
    title: "Cross-Contract Analysis",
    description: "Trace interactions across contract boundaries to uncover systemic risks.",
  },
  {
    icon: Shield,
    title: "Invariant-Guided Detection",
    description: "Property-based reasoning to identify violations of protocol guarantees.",
  },
  {
    icon: BarChart3,
    title: "Security Coverage Testing",
    description: "Comprehensive coverage metrics so you know exactly what's been audited.",
  },
];

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <HeroBackground />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center flex-grow px-6 py-12 sm:py-20">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3 mb-12">
          <img
            src={solarizerLogo}
            alt="Solarizer"
            className="w-10 h-10 rounded-xl object-cover"
            decoding="sync"
          />
          <span className="text-xl font-bold tracking-tight text-gradient">
            Solarizer
          </span>
        </div>

        {/* Hero */}
        <div className="text-center max-w-2xl mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            Coming Soon
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto">
            AI-Powered Smart Contract Security — launching&nbsp;soon.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/signup"
          className="rounded-full border-2 border-primary bg-transparent text-primary text-sm px-8 py-2.5 font-medium hover:bg-primary/10 hover:shadow-[0_0_20px_hsla(24,95%,53%,0.3)] transition-all duration-300"
        >
          Sign up for early access
        </Link>
      </div>

      {/* Minimal footer */}
      <footer className="relative z-20 text-center py-6 text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} Solarizer. All rights reserved.
      </footer>
    </div>
  );
};

export default ComingSoon;
