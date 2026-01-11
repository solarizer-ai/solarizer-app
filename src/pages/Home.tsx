import { Link } from "react-router-dom";
import { Shield, Zap, Lock, ArrowRight, CheckCircle2, Database, Wrench, Cpu, Layers, GitBranch, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Database,
    title: "Proprietary Deep Scan",
    description: "Fueled by our exclusive vulnerability index to catch complex logic errors that standard scanners miss.",
  },
  {
    icon: Wrench,
    title: "Remediation Intelligence",
    description: "Get precise, secure code alternatives tailored to your architectural needs, not just bug reports.",
  },
  {
    icon: Lock,
    title: "100% Private Analysis",
    description: "Your code never leaves our secure environment. Zero data retention policy.",
  },
  {
    icon: Zap,
    title: "Sub-5-Second Processing",
    description: "Enterprise-grade speed without compromising depth of analysis.",
  },
];

const intelligenceLoop = [
  {
    icon: Layers,
    step: "01",
    title: "Normalisation",
    description: "Our engine ingests and maps your Solidity architecture into our secure analysis environment.",
  },
  {
    icon: GitBranch,
    step: "02",
    title: "Pattern Synthesis",
    description: "The engine cross-references your codebase against our custom-curated library of historical exploits and logic vulnerabilities.",
  },
  {
    icon: Target,
    step: "03",
    title: "Agentic Verification",
    description: "A dual-layer 'Auditor' system challenges every finding to ensure 100% actionable, high-signal results.",
  },
];

const trustMetrics = [
  { value: "< 5s", label: "Average Scan Time" },
  { value: "100%", label: "Private Analysis" },
  { value: "Custom", label: "Exploit Database" },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        {/* Solar Ring Visual */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[500px] h-[500px] opacity-30">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-orbit" />
            {/* Middle ring */}
            <div className="absolute inset-8 rounded-full border border-primary/40 animate-orbit-reverse" />
            {/* Inner ring */}
            <div className="absolute inset-16 rounded-full border border-primary/50 animate-orbit" style={{ animationDuration: '15s' }} />
            {/* Core glow */}
            <div className="absolute inset-24 rounded-full bg-primary/10 animate-pulse-glow" />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary glow-orange-sm" />
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-28 md:py-40 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8">
              <Cpu className="w-4 h-4" />
              <span className="font-medium">Security Intelligence Engine</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Audit at the Speed{" "}
              <span className="text-gradient">of Code.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Solarizer is a specialized security engine powered by a proprietary database 
              of smart contract exploits. Detect vulnerabilities and logic flaws in seconds, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="solarGlow" size="lg" className="text-base px-8">
                <Link to="/auth">
                  Start Your Audit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-base px-8 text-muted-foreground hover:text-foreground">
                <Link to="/docs">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-primary/20 bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustMetrics.map((metric, index) => (
              <div key={metric.label} className="flex items-center gap-3">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
                {index < trustMetrics.length - 1 && (
                  <div className="hidden md:block w-px h-8 bg-border ml-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Proprietary Intelligence at Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built detection capabilities that go beyond standard vulnerability scanning.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:glow-orange-sm transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligence Loop Section */}
      <section className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Solarizer Intelligence Loop</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A three-stage analysis pipeline that ensures comprehensive coverage
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {intelligenceLoop.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="bg-card border border-border rounded-xl p-6 h-full border-l-2 border-l-primary">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/5">
                      <span className="text-xl font-bold text-primary">{step.step}</span>
                    </div>
                    <step.icon className="w-6 h-6 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {index < intelligenceLoop.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t border-dashed border-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Harden Your Contracts?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Deploy with confidence. The Solarizer Engine has your back.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="solarGlow" size="lg" className="text-base px-8">
                <Link to="/auth">
                  Launch Your First Audit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                100% private
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
