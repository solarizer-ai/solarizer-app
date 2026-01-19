import { Link } from "react-router-dom";
import { Brain, Dna, ShieldCheck, ArrowRight, CheckCircle2, FileCode2, Shield, Lock, Cpu, Check, X, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Brain,
    title: "Logic & Economic Analysis",
    description: "We go beyond basic scanning to detect broken invariants, insolvent math, and 'phantom' accounting errors that could lead to protocol-wide liquidity drains.",
  },
  {
    icon: FileCheck,
    title: "Security Coverage Transparency",
    description: "Every analysis generates a comprehensive report listing every hypothesis tested. You get data-driven proof of your protocol's resilience against smart contract security threats.",
  },
  {
    icon: FileCode2,
    title: "AI-Generated Remediation",
    description: "Receive precise, syntax-perfect Solidity fixes. Our analysis provides remediation code tailored to your specific variable naming and project architecture.",
  },
  {
    icon: Lock,
    title: "Private Scanning Environment",
    description: "Your IP remains protected. Analysis occurs in a stateless, isolated environment with 100% zero data retention. Your code is wiped the moment your report is finalized.",
  },
];

const intelligenceLoop = [
  {
    icon: Brain,
    step: "01",
    title: "Contextual Modeling",
    headline: "Contextual Modeling",
    description: "Our engine performs a comprehensive analysis of your architecture, mapping state changes and cross-contract dependencies to understand the global logic of your smart contract.",
  },
  {
    icon: Dna,
    step: "02",
    title: "Heuristic Scanning",
    headline: "Heuristic Scanning",
    description: "Your code is put through an intensive scanning phase against our proprietary Vulnerability DNA Matrix—an evolving index of complex smart contract security risks and exploit patterns.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Semantic AI Validation",
    headline: "Semantic AI Validation",
    description: "Results are refined through a dedicated AI analysis layer. This process challenges every finding to eliminate false positives, ensuring your report contains only high-signal security insights.",
  },
];

const trustMetrics = [
  { value: "On-Demand", label: "Architectural Analysis" },
  { value: "100% Private", label: "Ephemeral Scanning" },
  { value: "Comprehensive", label: "Security Coverage Report" },
];

const comparisonData = [
  {
    feature: "Delivery Time",
    manual: "7–21 Days (Average)",
    solarizer: "Minutes (On-Demand)",
  },
  {
    feature: "Scanning Depth",
    manual: "Manual Line-by-Line",
    solarizer: "Multi-Stage AI Scanning",
  },
  {
    feature: "Logic Verification",
    manual: "Subjective Human Review",
    solarizer: "Semantic AI Analysis",
  },
  {
    feature: "Availability",
    manual: "Scheduled Waitlists",
    solarizer: "Instant Access",
  },
];

const Home = () => {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

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
              Deep Smart Contract Security Analysis.{" "}
              <span className="text-gradient">Powered by AI.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Move beyond basic scanning. Solarizer utilizes advanced AI analysis to deconstruct your protocol's architecture, identifying critical Solidity vulnerabilities in minutes that manual teams take weeks to uncover.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="solarGlow" size="lg" className="text-base px-8">
                <Link to="/dashboard">
                  Start AI Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-base px-8 text-muted-foreground hover:text-foreground"
                onClick={scrollToHowItWorks}
              >
                See How It Works
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

      {/* Intelligence Loop Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sophisticated Analysis for the Solidity Ecosystem.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Solarizer's pipeline mimics the specialized analysis of a senior security researcher, using AI to validate every layer of your protocol.
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
                  <div className="text-xs uppercase tracking-wider text-primary/70 mb-1">{step.title}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.headline}</h3>
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

      {/* Comparison Table Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare the Depth of AI Analysis.</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-semibold text-foreground">Feature</th>
                    <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Traditional Manual Review</th>
                    <th className="text-left py-4 px-6 font-semibold text-primary">Solarizer AI Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr 
                      key={row.feature} 
                      className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                    >
                      <td className="py-4 px-6 font-medium text-foreground">{row.feature}</td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-destructive/60" />
                          {row.manual}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          {row.solarizer}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Core Analysis Pillars
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

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Defend Against the Unforeseen.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              The only engine that evolves as fast as the exploit landscape.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="solarGlow" size="lg" className="text-base px-8">
                <Link to="/dashboard">
                  Secure Your Protocol
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
