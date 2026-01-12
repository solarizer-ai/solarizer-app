import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 12, 2026</p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 rounded-lg bg-card border border-border">
            <h2 className="font-semibold mb-4">Table of Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#acceptance" className="text-primary hover:underline">1. Acceptance of Terms</a></li>
              <li><a href="#service-description" className="text-primary hover:underline">2. Service Description</a></li>
              <li><a href="#intellectual-property" className="text-primary hover:underline">3. Intellectual Property</a></li>
              <li><a href="#acceptable-use" className="text-primary hover:underline">4. Acceptable Use Policy</a></li>
              <li><a href="#subscriptions" className="text-primary hover:underline">5. Subscriptions & Payments</a></li>
              <li><a href="#limitation-liability" className="text-primary hover:underline">6. Limitation of Liability</a></li>
              <li><a href="#indemnification" className="text-primary hover:underline">7. Indemnification</a></li>
              <li><a href="#dispute-resolution" className="text-primary hover:underline">8. Dispute Resolution</a></li>
              <li><a href="#modifications" className="text-primary hover:underline">9. Modifications</a></li>
              <li><a href="#contact" className="text-primary hover:underline">10. Contact</a></li>
            </ul>
          </nav>

          <div className="prose prose-invert max-w-none space-y-12">
            {/* Acceptance of Terms */}
            <section id="acceptance">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing or using the Solarizer platform, including our Audit Wizard, Intelligence Engine, and 
                all related services (collectively, the "Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These Terms constitute a legally binding agreement between you and Solarizer. By creating an account 
                or using our proprietary smart contract security intelligence platform, you represent that you are 
                at least 18 years of age and have the legal capacity to enter into this agreement.
              </p>
            </section>

            {/* Service Description */}
            <section id="service-description">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solarizer provides an AI-powered smart contract security analysis platform that includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>The Audit Wizard for uploading and analyzing smart contract source code</li>
                <li>The Intelligence Engine for automated vulnerability detection and security scoring</li>
                <li>Security reports and remediation recommendations</li>
                <li>Dashboard analytics and audit history management</li>
              </ul>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                <h4 className="font-semibold text-warning mb-2">"As-Is" Service</h4>
                <p className="text-muted-foreground text-sm">
                  The Service is provided on an "as-is" and "as-available" basis. While our proprietary engine 
                  provides high-fidelity analysis using advanced AI techniques, the Service is an analytical tool 
                  and should be used as part of a comprehensive security strategy.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section id="intellectual-property">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">3.1 Your Content</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>You retain full ownership</strong> of all smart contract source code, files, and other 
                materials you upload to the Service ("User Content"). By uploading User Content, you grant 
                Solarizer a limited, non-exclusive license to process your content solely for the purpose of 
                providing the security analysis services.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We do not claim any ownership rights over your User Content, and this license terminates 
                immediately upon completion of the analysis or upon your request.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-foreground">3.2 Solarizer Intellectual Property</h3>
              <p className="text-muted-foreground leading-relaxed">
                Solarizer retains all rights, title, and interest in:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Our proprietary security analysis engine and AI algorithms</li>
                <li>Detection patterns, vulnerability signatures, and analysis methodologies</li>
                <li>The structure, format, and presentation of generated security reports</li>
                <li>All trademarks, logos, and branding elements</li>
                <li>Platform software, interfaces, and documentation</li>
              </ul>
            </section>

            {/* Acceptable Use */}
            <section id="acceptable-use">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Acceptable Use Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service for any unlawful purpose or in violation of these Terms. 
                Specifically, you may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Upload or analyze stolen, misappropriated, or unauthorized code</li>
                <li>Attempt to reverse-engineer, decompile, or extract the Solarizer engine or algorithms</li>
                <li>Use the Service to develop competing products or services</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Circumvent any security measures or access controls</li>
                <li>Use automated systems (bots, scrapers) to access the Service without authorization</li>
                <li>Share account credentials or allow unauthorized access</li>
                <li>Use the Service to analyze code for malicious purposes</li>
              </ul>
            </section>

            {/* Subscriptions & Payments */}
            <section id="subscriptions">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Subscriptions & Payments</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">5.1 Subscription Tiers</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solarizer offers the following subscription plans:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li><strong>Starter:</strong> Basic access with limited NLOC credits and scan capacity</li>
                <li><strong>Pro:</strong> Enhanced access with increased credits, priority processing, and advanced features</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-foreground">5.2 Billing</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Subscriptions are billed in advance on a monthly or annual basis, depending on your selected plan. 
                All payments are processed securely through Stripe. Applicable taxes will be added based on your location.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-foreground">5.3 Refund Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Due to the nature of our digital services, refunds are generally not provided after credits have been 
                used. However, if you experience technical issues preventing you from using the Service, please 
                contact our support team within 7 days of purchase for case-by-case consideration.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section id="limitation-liability">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Limitation of Liability</h2>
              
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                <h4 className="font-semibold text-destructive mb-2">Critical Disclaimer for Security Tools</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  While Solarizer provides high-fidelity security analysis using our proprietary AI engine, 
                  <strong> no automated analysis can guarantee complete security</strong>. Our Service is designed 
                  to assist in identifying potential vulnerabilities but should not be relied upon as the sole 
                  security measure.
                </p>
                <p className="text-muted-foreground text-sm">
                  <strong>Solarizer expressly disclaims any liability for financial losses, damages, or other 
                  consequences resulting from exploits, vulnerabilities, or security breaches in analyzed smart 
                  contracts</strong>, whether or not such issues were identified or missed by our analysis.
                </p>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  The Service is provided "as-is" without warranties of any kind, express or implied, including 
                  but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                </li>
                <li>
                  Solarizer's total liability for any claims arising from your use of the Service shall not exceed 
                  the amount you paid for the Service in the 12 months preceding the claim.
                </li>
                <li>
                  In no event shall Solarizer be liable for any indirect, incidental, special, consequential, or 
                  punitive damages, including but not limited to loss of profits, data, or cryptocurrency assets.
                </li>
              </ul>
            </section>

            {/* Indemnification */}
            <section id="indemnification">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Solarizer and its officers, directors, employees, 
                and agents from and against any claims, damages, losses, liabilities, and expenses (including 
                reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your 
                violation of these Terms; (c) your User Content; or (d) your violation of any third-party rights.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section id="dispute-resolution">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">8.1 Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India, without 
                regard to its conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-foreground">8.2 Jurisdiction</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Any disputes arising out of or relating to these Terms or the Service shall be subject to the 
                exclusive jurisdiction of the courts located in Ahmedabad, Gujarat, India.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-foreground">8.3 Informal Resolution</h3>
              <p className="text-muted-foreground leading-relaxed">
                Before initiating any formal legal proceedings, you agree to first attempt to resolve any dispute 
                informally by contacting us at legal@solarizer.io. We will attempt to resolve the dispute through 
                good-faith negotiations within 30 days.
              </p>
            </section>

            {/* Modifications */}
            <section id="modifications">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes 
                by posting the updated Terms on our website and updating the "Last updated" date. Your continued 
                use of the Service after such modifications constitutes your acceptance of the updated Terms. 
                If you do not agree to the modified Terms, you must stop using the Service.
              </p>
            </section>

            {/* Contact */}
            <section id="contact">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Contact</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="p-6 rounded-lg bg-card border border-border">
                <p className="text-foreground font-semibold mb-2">Solarizer Team</p>
                <p className="text-muted-foreground">Email: hello@solarizer.io</p>
              </div>
            </section>

            <div className="pt-8 border-t border-border">
              <p className="text-muted-foreground text-sm">
                By using Solarizer, you acknowledge that you have read, understood, and agree to be bound by 
                these Terms of Service. Please also review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
