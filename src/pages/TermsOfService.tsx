import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 22, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#acceptance" className="block text-primary hover:underline">1. Acceptance of Terms</a>
            <a href="#service" className="block text-primary hover:underline">2. Service Description</a>
            <a href="#ip" className="block text-primary hover:underline">3. Intellectual Property</a>
            <a href="#acceptable-use" className="block text-primary hover:underline">4. Acceptable Use Policy</a>
            <a href="#subscriptions" className="block text-primary hover:underline">5. Subscriptions, Power up Credits & Payments</a>
            <a href="#liability" className="block text-primary hover:underline">6. Limitation of Liability</a>
            <a href="#refunds" className="block text-primary hover:underline">7. Refunds and Termination</a>
          </nav>
        </div>

        {/* Terms Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Section 1 */}
          <section id="acceptance">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Solarizer platform, including our Audit Wizard, Intelligence Engine, 
              and all related services (collectively, the "Service"), you agree to be bound by these Terms of 
              Service ("Terms"). Solarizer is a proprietary smart contract security intelligence platform. 
              By creating an account, you represent that you are at least 18 years of age.
            </p>
          </section>

          {/* Section 2 */}
          <section id="service">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              2. Service Description
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Solarizer provides AI-powered smart contract security analysis. The Service is provided on an 
              "as-is" basis. While our proprietary engine provides high-fidelity analysis, it is an analytical 
              tool and should be used as part of a comprehensive security strategy.
            </p>
          </section>

          {/* Section 3 */}
          <section id="ip">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              3. Intellectual Property
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">3.1 Your Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You retain full ownership of all smart contract source code and files uploaded. You grant 
                  Solarizer a limited license to process your content solely to provide security analysis.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">3.2 Solarizer IP</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Solarizer retains all rights to our proprietary security engine, AI algorithms, detection 
                  patterns, and the structure of generated reports.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="acceptable-use">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              4. Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not: upload unauthorized code, attempt to reverse-engineer the Solarizer engine, use 
              the Service to develop competing products, or use automated systems (bots) to access the 
              Service without authorization.
            </p>
          </section>

          {/* Section 5 */}
          <section id="subscriptions">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              5. Subscriptions, Power up Credits & Payments
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.1 Subscription Tiers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Solarizer offers various tiers (e.g., Launch, Pro, Business).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.2 Power up Credits</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                  <li><span className="font-medium text-foreground">Definition:</span> 1 Power up Credit allows for the audit of 1 line of Solidity code.</li>
                  <li><span className="font-medium text-foreground">Validity:</span> Purchased Power up Credits remain in your account indefinitely and do not expire at the end of a billing cycle.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.3 Credit Fair Usage Policy (Downgrades)</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Upon downgrading a subscription plan, the monetary value of your remaining Power up Credits 
                  is preserved and converted based on the credit rate of the new plan.
                </p>
                <div className="bg-muted/50 border border-border rounded-lg p-4 my-4">
                  <p className="text-sm font-medium text-foreground mb-2">Formula:</p>
                  <code className="text-primary font-mono text-sm">
                    NewBalance = ⌊(RemainingCredits × OldPlanRate) / NewPlanRate⌋
                  </code>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This conversion ensures fairness across different pricing tiers. Upgrades do not trigger 
                  credit conversion; balances remain the same.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.4 Billing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Payments are processed securely through our designated third-party payment processors. 
                  Applicable taxes are added based on your location.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="liability">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              6. Limitation of Liability
            </h2>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-destructive mb-2">Critical Disclaimer</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No automated analysis can guarantee 100% security. Solarizer expressly disclaims any liability 
                for financial losses, exploits, or security breaches in analyzed contracts, whether or not 
                such issues were identified by the Service.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Total liability shall not exceed the amount paid in the 12 months preceding a claim.
            </p>
          </section>

          {/* Section 7 */}
          <section id="refunds">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              7. Refunds and Termination
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.1 Forfeiture on Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                  If your account or access to the Service is terminated by Solarizer for a breach of these Terms, 
                  any remaining Power up Credits (whether from your subscription allowance or purchased separately) 
                  will be forfeited. If you cancel your account or subscription, your remaining Power up Credits 
                  will remain available until the end of your current billing period. If we terminate your account 
                  for any reason other than your breach of these Terms (including for security, legal, or other 
                  reasons not attributable to you), any remaining Power up Credits will be applied to fees owed 
                  through the effective date of termination, after which they will expire.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.2 No Refunds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Except where required by applicable law, all fees paid for subscriptions and Power up Credits 
                  are non-refundable.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.3 Effect of Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Termination of your account or these Terms ends your right to access the Service, but does not 
                  affect any rights or obligations that, by their nature, should continue. This includes, but is 
                  not limited to: intellectual property rights, disclaimers, limitations of liability, 
                  indemnification obligations, and any outstanding payment obligations.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">
              hello@solarizer.io
            </a>
            . See also our{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
