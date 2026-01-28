import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 20, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-primary hover:underline">1. Introduction</a>
            <a href="#collection" className="block text-primary hover:underline">2. Information We Collect</a>
            <a href="#usage" className="block text-primary hover:underline">3. How We Use Your Data & AI Disclosure</a>
            <a href="#security" className="block text-primary hover:underline">4. Data Security</a>
            <a href="#rights" className="block text-primary hover:underline">5. Your Rights</a>
            <a href="#contact" className="block text-primary hover:underline">6. Contact Us</a>
          </nav>
        </div>

        {/* Privacy Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Section 1 */}
          <section id="introduction">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Solarizer ("we," "our," or "us") is the data controller responsible for your personal 
              information. We are committed to transparency in our AI processing practices and comply 
              with major global data protection standards, including GDPR and CCPA.
            </p>
          </section>

          {/* Section 2 */}
          <section id="collection">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">Personal Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Name, email address, and billing information (processed securely via our third-party 
                  payment gateways).
                </p>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">Technical Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  IP addresses, browser types, and interaction patterns within the platform.
                </p>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">Project Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Smart contract source code and file metadata uploaded for security analysis.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="usage">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              3. How We Use Your Data & AI Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your data to process smart contracts through our proprietary engine and generate 
              vulnerability reports.
            </p>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-primary mb-2">AI Disclosure</h3>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Your submitted smart contract code is processed solely for security analysis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">It is not used to train our proprietary AI model.</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>We implement a <strong className="text-foreground">zero data retention policy</strong> for code after analysis unless you explicitly choose to save results.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="security">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              4. Data Security
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-medium text-foreground mb-1">Encryption at Rest</h3>
                <p className="text-muted-foreground text-sm">AES-256 encryption</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-medium text-foreground mb-1">Encryption in Transit</h3>
                <p className="text-muted-foreground text-sm">TLS 1.3 secured</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-medium text-foreground mb-1">Access Controls</h3>
                <p className="text-muted-foreground text-sm">Role-based access</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="rights">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              5. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you have the right to access, rectify, or erase your personal 
              data. Users in various jurisdictions have specific rights regarding data portability and 
              the right to opt-out of data collection.
            </p>
          </section>

          {/* Section 6 */}
          <section id="contact">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              6. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions or to exercise your privacy rights, please contact the Solarizer Team at{" "}
              <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">
                hello@solarizer.io
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            See also our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
