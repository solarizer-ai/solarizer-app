import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 12, 2026</p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 rounded-lg bg-card border border-border">
            <h2 className="font-semibold mb-4">Table of Contents</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#introduction" className="text-primary hover:underline">1. Introduction</a></li>
              <li><a href="#information-collected" className="text-primary hover:underline">2. Information We Collect</a></li>
              <li><a href="#how-we-use" className="text-primary hover:underline">3. How We Use Your Data</a></li>
              <li><a href="#legal-basis" className="text-primary hover:underline">4. Legal Basis for Processing</a></li>
              <li><a href="#data-security" className="text-primary hover:underline">5. Data Security</a></li>
              <li><a href="#international-transfers" className="text-primary hover:underline">6. International Transfers</a></li>
              <li><a href="#user-rights" className="text-primary hover:underline">7. Your Rights</a></li>
              <li><a href="#contact" className="text-primary hover:underline">8. Contact Us</a></li>
            </ul>
          </nav>

          <div className="prose prose-invert max-w-none space-y-12">
            {/* Introduction */}
            <section id="introduction">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solarizer ("we," "our," or "us") is the data controller responsible for processing your personal information. 
                This Privacy Policy explains how our proprietary AI-powered smart contract security intelligence platform 
                collects, uses, and protects your data.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to transparency in our AI processing practices and ensuring that your data is handled 
                in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR) 
                and the California Consumer Privacy Act (CCPA).
              </p>
            </section>

            {/* Information We Collect */}
            <section id="information-collected">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Personal Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>Full name and email address for account creation and communication</li>
                <li>Billing information processed securely via Stripe for subscription payments</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Technical Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We automatically collect certain technical information when you use our platform:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>IP addresses and device identifiers</li>
                <li>Browser type, version, and operating system</li>
                <li>Usage analytics and interaction patterns within the platform</li>
                <li>Session duration and feature usage statistics</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-foreground">2.3 Project Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you use our Audit Wizard and Intelligence Engine, we process:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Smart contract source code uploaded for security analysis</li>
                <li>File metadata including file names, sizes, and structure</li>
                <li>Analysis results and generated security reports</li>
              </ul>
            </section>

            {/* How We Use Your Data */}
            <section id="how-we-use">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. How We Use Your Data</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use your information to provide and maintain the Solarizer Intelligence Loop, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>Processing your smart contract code through our proprietary security engine</li>
                <li>Generating comprehensive vulnerability reports and security assessments</li>
                <li>Managing your account and subscription</li>
                <li>Communicating important updates about our service</li>
                <li>Improving our platform and developing new features</li>
              </ul>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <h4 className="font-semibold text-primary mb-2">AI Disclosure</h4>
                <p className="text-muted-foreground text-sm">
                  <strong>Important:</strong> Your submitted smart contract code is processed solely for the purpose of 
                  security analysis and is <strong>not</strong> used to train our proprietary AI engine. Your code remains 
                  yours, and we implement a zero data retention policy after analysis completion unless you explicitly 
                  choose to save audit results to your account.
                </p>
              </div>
            </section>

            {/* Legal Basis */}
            <section id="legal-basis">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Legal Basis for Processing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We process your personal data under the following legal bases:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Contract Necessity:</strong> Processing is necessary to perform our contract with you, 
                  including providing security analysis services and managing your subscription.
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> We process data to improve our services, ensure platform 
                  security, and prevent fraud.
                </li>
                <li>
                  <strong>User Consent:</strong> Where required, we obtain your explicit consent for marketing 
                  communications and optional data processing activities.
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section id="data-security">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-leading security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Encryption at Rest:</strong> All stored data is protected using AES-256 encryption</li>
                <li><strong>Encryption in Transit:</strong> All data transmissions are secured using TLS 1.3 protocol</li>
                <li><strong>Access Controls:</strong> Strict role-based access controls limit data access to authorized personnel</li>
                <li><strong>Regular Audits:</strong> We conduct regular security assessments and vulnerability testing</li>
                <li><strong>Secure Infrastructure:</strong> Our platform is hosted on enterprise-grade cloud infrastructure</li>
              </ul>
            </section>

            {/* International Transfers */}
            <section id="international-transfers">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. International Transfers</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Solarizer operates globally with infrastructure in India, the United States, and Europe. When we 
                transfer your personal data internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Compliance with the EU-US Data Privacy Framework where applicable</li>
                <li>Data processing agreements with all third-party service providers</li>
                <li>Regular assessments of data transfer mechanisms</li>
              </ul>
            </section>

            {/* User Rights */}
            <section id="user-rights">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Under GDPR (European Users)</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-foreground">Under CCPA (California Residents)</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li><strong>Right to Know:</strong> Request disclosure of personal information collected</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (Note: Solarizer does not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service and pricing regardless of privacy choices</li>
              </ul>
            </section>

            {/* Contact */}
            <section id="contact">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="p-6 rounded-lg bg-card border border-border">
                <p className="text-foreground font-semibold mb-2">Solarizer Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@solarizer.io</p>
                <p className="text-muted-foreground">Address: Ahmedabad, Gujarat, India</p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                For EU residents, you also have the right to lodge a complaint with your local data protection authority.
              </p>
            </section>

            <div className="pt-8 border-t border-border">
              <p className="text-muted-foreground text-sm">
                By using Solarizer, you acknowledge that you have read and understood this Privacy Policy. 
                Please also review our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
