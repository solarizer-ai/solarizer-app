import { Link } from "react-router-dom";
import { Shield, Zap, FileText, Lock, ArrowRight, CheckCircle2, Code2, Search, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

const features = [
  {
    icon: Shield,
    title: "Security Scanning",
    description: "Comprehensive vulnerability detection for Solidity smart contracts with industry-leading accuracy.",
  },
  {
    icon: Zap,
    title: "Fast Analysis",
    description: "Get results in seconds, not hours. Our engine processes contracts at lightning speed.",
  },
  {
    icon: FileText,
    title: "Detailed Reports",
    description: "Export professional PDF reports with findings, remediation steps, and security scores.",
  },
  {
    icon: Lock,
    title: "Best Practices",
    description: "Ensure your contracts follow industry security standards and best practices.",
  },
];

const steps = [
  {
    icon: Code2,
    step: "01",
    title: "Upload Your Code",
    description: "Drag and drop your Solidity contracts or paste code directly into the editor.",
  },
  {
    icon: Search,
    step: "02",
    title: "Automated Analysis",
    description: "Our engine scans for vulnerabilities, gas optimizations, and security issues.",
  },
  {
    icon: FileWarning,
    step: "03",
    title: "Review & Fix",
    description: "Get actionable insights with severity ratings and remediation guidance.",
  },
];

const stats = [
  { value: "10K+", label: "Contracts Audited" },
  { value: "500+", label: "Vulnerabilities Found" },
  { value: "99.9%", label: "Uptime" },
  { value: "<5s", label: "Avg Scan Time" },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Shield className="w-4 h-4" />
              <span>Smart Contract Security Platform</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Secure Your Smart Contracts{" "}
              <span className="text-gradient">Before Launch</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Detect vulnerabilities, optimize gas usage, and ensure your Solidity contracts 
              meet the highest security standards with our automated auditing platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Contract Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to identify, understand, and fix security vulnerabilities in your smart contracts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-card/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to secure your smart contracts
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-xs font-medium text-primary mb-2">STEP {step.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Contracts?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of developers who trust Solarizer for smart contract security. 
              Start with our free plan today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/auth">
                  Start Free Audit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                No credit card required
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
