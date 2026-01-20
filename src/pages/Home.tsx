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
          <div className="max-w-4xl mx-auto text-center overflow-visible">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8">
              <Cpu className="w-4 h-4" />
              <span className="font-medium">Security Intelligence Engine</span>
            </div>
            <h1 className="text-[clamp(1.75rem,5vw,4.5rem)] font-bold tracking-tight mb-2">
              Architectural Reasoning.
            </h1>
            <p className="text-[clamp(1.5rem,4.5vw,3.75rem)] font-bold tracking-tight mb-6 text-gradient">
              Automated Rigor.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Surface-level scanners catch syntax errors; Solarizer deconstructs your protocol's entire logic model. It performs deep analysis to identify complex Solidity vulnerabilities and economic risks in minutes.
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

      {/* Intelligence Loop Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Protocol Intelligence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Execute high-fidelity analysis of inheritance structures and cross-contract interactions, cross-referencing them with specialized security DNA to harden your protocol.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {intelligenceLoop.map((step, index) => (
              <div key={step.title} className="relative group">
                <div className="bg-card border border-border rounded-xl p-6 h-full border-l-2 border-l-primary transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/5 mb-4">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xs uppercase tracking-wider text-primary mb-3">{step.title}</h3>
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
            <div className="overflow-x-auto -mx-6 px-6 relative">
              <table className="w-full border-collapse min-w-[500px] md:min-w-0">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-10 bg-background text-left py-3 px-3 md:py-4 md:px-6 font-semibold text-foreground text-xs md:text-base after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border/50">Feature</th>
                    <th className="text-left py-3 px-3 md:py-4 md:px-6 font-semibold text-muted-foreground text-xs md:text-base">
                      <span className="hidden sm:inline">Traditional Manual Review</span>
                      <span className="sm:hidden">Manual</span>
                    </th>
                    <th className="text-left py-3 px-3 md:py-4 md:px-6 font-semibold text-primary text-xs md:text-base">
                      <span className="hidden sm:inline">Solarizer AI Analysis</span>
                      <span className="sm:hidden">Solarizer</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr 
                      key={row.feature} 
                      className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-card/30' : ''}`}
                    >
                      <td className="sticky left-0 z-10 bg-background py-3 px-3 md:py-4 md:px-6 font-medium text-foreground text-xs md:text-sm after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border/50">{row.feature}</td>
                      <td className="py-3 px-3 md:py-4 md:px-6 text-muted-foreground text-xs md:text-sm">
                        <div className="flex items-center gap-1 md:gap-2">
                          <X className="w-3 h-3 md:w-4 md:h-4 text-destructive/60 flex-shrink-0" />
                          <span className="hidden sm:inline">{row.manual}</span>
                          <span className="sm:hidden">{row.manual.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 md:py-4 md:px-6 text-foreground text-xs md:text-sm">
                        <div className="flex items-center gap-1 md:gap-2">
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
                          <span className="hidden sm:inline">{row.solarizer}</span>
                          <span className="sm:hidden">{row.solarizer.split(' ').slice(0, 2).join(' ')}</span>
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
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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