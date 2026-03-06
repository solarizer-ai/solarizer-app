import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: February 22, 2026</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-primary hover:underline">1. Introduction & Scope</a>
            <a href="#definitions" className="block text-primary hover:underline">2. Definitions</a>
            <a href="#collection" className="block text-primary hover:underline">3. Information We Collect</a>
            <a href="#legal-bases" className="block text-primary hover:underline">4. Legal Bases for Processing</a>
            <a href="#usage" className="block text-primary hover:underline">5. How We Use Your Information</a>
            <a href="#ai-disclosure" className="block text-primary hover:underline">6. AI & Automated Processing Disclosure</a>
            <a href="#data-sharing" className="block text-primary hover:underline">7. Data Sharing & Third Parties</a>
            <a href="#international-transfers" className="block text-primary hover:underline">8. International Data Transfers</a>
            <a href="#retention" className="block text-primary hover:underline">9. Data Retention</a>
            <a href="#security" className="block text-primary hover:underline">10. Data Security</a>
            <a href="#rights" className="block text-primary hover:underline">11. Your Privacy Rights</a>
            <a href="#cookies" className="block text-primary hover:underline">12. Cookies & Tracking Technologies</a>
            <a href="#children" className="block text-primary hover:underline">13. Children's Privacy</a>
            <a href="#changes" className="block text-primary hover:underline">14. Changes to This Policy</a>
            <a href="#contact" className="block text-primary hover:underline">15. Contact & Data Protection</a>
          </nav>
        </div>

        {/* Privacy Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Section 1: Introduction & Scope */}
          <section id="introduction">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              1. Introduction & Scope
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Solarizer ("we," "our," or "us") is the data controller responsible for your personal information. Solarizer is currently a brand name; the operating entity is in the process of incorporation. This Privacy Policy describes how we collect, use, store, share, and protect information when you use the Solarizer platform, including:
            </p>
            <ul className="text-muted-foreground text-sm space-y-2 ml-2 mb-4">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>The Solarizer CLI (command-line interface)</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>The Solarizer web dashboard (solarizer.io)</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>The Solarizer website and documentation</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>Any related APIs, tools, or services</span></li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We are committed to transparency in our data practices, particularly regarding how we handle smart contract source code and our use of AI technologies. This Policy is designed to comply with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), the Digital Personal Data Protection Act, 2023 (India), and other applicable data protection laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using the Service, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>

          {/* Section 2: Definitions */}
          <section id="definitions">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              2. Definitions
            </h2>
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">"Personal Data"</strong> means any information that identifies or can be used to identify you as an individual, including name, email address, IP address, and account identifiers.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">"Project Data"</strong> means smart contract source code, file metadata, and any other materials you submit to the Service for analysis.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">"Analysis Output"</strong> means the security findings, vulnerability reports, severity classifications, and remediation guidance generated by the Service.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">"Processing"</strong> means any operation performed on data, including collection, storage, use, analysis, transmission, and deletion.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong className="text-foreground">"Controller"</strong> means the entity that determines the purposes and means of Processing Personal Data. For data processed through the Service, Solarizer is the Controller.
              </p>
            </div>
          </section>

          {/* Section 3: Information We Collect */}
          <section id="collection">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              3. Information We Collect
            </h2>
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">3.1 Account Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">Information you provide when creating and managing your account:</p>
                <ul className="text-muted-foreground text-sm space-y-1 ml-4 list-disc">
                  <li>Name and email address</li>
                  <li>Password (stored in hashed form)</li>
                  <li>Billing information (processed by our third-party payment provider; we do not store full payment card details)</li>
                  <li>Subscription plan and credit balance</li>
                  <li>Authentication tokens and API keys</li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">3.2 Technical Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">Information collected automatically when you access the Service:</p>
                <ul className="text-muted-foreground text-sm space-y-1 ml-4 list-disc">
                  <li>IP address and approximate geolocation</li>
                  <li>Browser type, version, and operating system</li>
                  <li>Device identifiers</li>
                  <li>Referral source and pages visited</li>
                  <li>Date and time of access</li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">3.3 Usage Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">Information about how you interact with the Service:</p>
                <ul className="text-muted-foreground text-sm space-y-1 ml-4 list-disc">
                  <li>Features used and actions taken within the CLI and dashboard</li>
                  <li>Audit session metadata (file counts, nLOC totals, phases executed, duration)</li>
                  <li>Credit consumption records</li>
                  <li>Error logs and performance diagnostics</li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-2">3.4 Project Data</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-2">Information you submit for security analysis:</p>
                <ul className="text-muted-foreground text-sm space-y-1 ml-4 list-disc">
                  <li>Smart contract source code files</li>
                  <li>File names, paths, and metadata</li>
                  <li>Complexity classifications assigned during analysis</li>
                </ul>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                  Project Data is handled with heightened security measures as described in Section 6 (AI & Automated Processing Disclosure) and Section 9 (Data Retention).
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Legal Bases for Processing */}
          <section id="legal-bases">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              4. Legal Bases for Processing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Where applicable under the GDPR and similar frameworks, we process your information on the following legal bases:
            </p>
            <ul className="text-muted-foreground text-sm space-y-3 ml-2">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Contract Performance (Art. 6(1)(b) GDPR):</strong> Processing necessary to provide the Service you have requested, including analyzing your smart contracts, managing your subscription, and generating reports.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Legitimate Interest (Art. 6(1)(f) GDPR):</strong> Processing necessary for our legitimate business interests, including improving the Service, preventing fraud, ensuring security, and communicating with you about your account. We balance these interests against your rights and freedoms.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Consent (Art. 6(1)(a) GDPR):</strong> Where you have given explicit consent, such as for receiving marketing communications. You may withdraw consent at any time.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Legal Obligation (Art. 6(1)(c) GDPR):</strong> Processing necessary to comply with applicable laws, including tax reporting, anti-money laundering, and responses to lawful government requests.</span></li>
            </ul>
          </section>

          {/* Section 5: How We Use Your Information */}
          <section id="usage">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              5. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="text-muted-foreground text-sm space-y-2 ml-2">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Service Delivery:</strong> Processing your smart contracts through our analysis engine, generating vulnerability reports, managing your subscription, and tracking credit consumption.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Account Management:</strong> Creating, maintaining, and securing your account; processing payments; communicating about your subscription.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Service Improvement:</strong> Analyzing aggregate usage patterns and error data to improve the reliability, performance, and features of the Service. This does not involve using your source code.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Security:</strong> Detecting, preventing, and responding to fraud, abuse, security incidents, and technical issues.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Communication:</strong> Sending transactional messages (receipts, account alerts, service updates), and with your consent, promotional communications.</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Legal Compliance:</strong> Complying with applicable laws, regulations, legal processes, and government requests.</span></li>
            </ul>
          </section>

          {/* Section 6: AI & Automated Processing Disclosure */}
          <section id="ai-disclosure">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              6. AI & Automated Processing Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Solarizer uses artificial intelligence and automated decision-making to analyze smart contract source code and generate security findings. This section provides transparency about how your data interacts with our AI systems.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">6.1 What Our AI Does</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Service employs multiple specialized AI models in a structured pipeline to perform security analysis. These models classify contract complexity, identify vulnerability patterns, validate findings, and generate reports. Findings include severity classifications (Critical, High, Medium, Low, Info, Gas) assigned through automated analysis.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">6.2 What Data the AI Processes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI processes the smart contract source code and file metadata you submit for analysis. It does not access your personal data (name, email, billing information) during analysis.
                </p>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-primary mb-3">Key Commitments</h3>
                <ul className="text-muted-foreground text-sm space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">No Training on Your Code.</strong> Your source code is never used to train, fine-tune, or improve our AI models. Your Content is processed solely to generate your Analysis Output.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Isolated Processing.</strong> Each analysis session runs in its own sandboxed environment. There is no shared state between sessions or users. Your code is never accessible to other users or commingled with other users' data.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span><strong className="text-foreground">Zero Retention.</strong> Source code submitted for analysis is not stored on our infrastructure beyond the duration of your active analysis session. When the session ends, the processing environment is destroyed. Analysis Output is retained only if you choose to save it to your dashboard.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">6.3 Human Review</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Analysis Output is generated entirely through automated processing. You have the right to request human review of any AI-generated finding or severity classification. To request a review, contact{" "}
                  <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">hello@solarizer.io</a>.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">6.4 Limitations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-generated findings are probabilistic assessments, not guarantees. The Service may produce false positives (reporting a vulnerability that does not exist) or false negatives (failing to identify a vulnerability that does exist). Analysis Output should be reviewed by qualified professionals and used as part of a broader security strategy.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Data Sharing & Third Parties */}
          <section id="data-sharing">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              7. Data Sharing & Third Parties
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.1 We Do Not Sell Your Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Solarizer does not sell, rent, or trade your Personal Data or Project Data to any third party. We do not share your data for third-party advertising purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.2 Service Providers</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We share information with third-party service providers who assist in delivering the Service, including:
                </p>
                <ul className="text-muted-foreground text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Payment Processors:</strong> To process subscription payments and credit purchases. These providers have access to billing information necessary to complete transactions.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Infrastructure Providers:</strong> To host and operate the Service, including cloud computing and storage services. These providers process data on our behalf under contractual data protection obligations.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Analytics Providers:</strong> To understand aggregate usage patterns and improve the Service. Analytics data is anonymized or pseudonymized where possible.</span></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.3 Legal Disclosures</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may disclose your information if required to do so by law, or if we believe in good faith that such action is necessary to: (a) comply with a legal obligation, court order, or government request; (b) protect and defend our rights or property; (c) prevent fraud or address security issues; or (d) protect the personal safety of users or the public.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">7.4 Business Transfers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  In the event of a merger, acquisition, bankruptcy, or sale of all or a portion of our assets, your information may be transferred to the acquiring entity. We will notify you via email or prominent notice on the Service before your information is transferred and becomes subject to a different privacy policy.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: International Data Transfers */}
          <section id="international-transfers">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              8. International Data Transfers
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Solarizer is operated by Solarizer. Your information may be processed in jurisdictions other than your country of residence, including countries that may not provide the same level of data protection as your home jurisdiction.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Where we transfer Personal Data outside of the European Economic Area (EEA), the United Kingdom, or other jurisdictions with data transfer restrictions, we rely on appropriate safeguards, including:
            </p>
            <ul className="text-muted-foreground text-sm space-y-2 ml-2 mb-4">
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>Standard Contractual Clauses (SCCs) approved by the European Commission</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>Adequacy decisions by relevant data protection authorities</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>Binding Corporate Rules, where applicable</span></li>
              <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>Your explicit consent, where other safeguards are not available</span></li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You may request information about the specific safeguards applied to transfers of your data by contacting{" "}
              <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">hello@solarizer.io</a>.
            </p>
          </section>

          {/* Section 9: Data Retention */}
          <section id="retention">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              9. Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your information only for as long as necessary to fulfill the purposes described in this Policy, unless a longer retention period is required or permitted by law.
            </p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-foreground font-medium">Data Category</th>
                      <th className="text-left py-2 pl-4 text-foreground font-medium">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">Account Data</td>
                      <td className="py-2 pl-4">Duration of your account plus 30 days after deletion</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">Project Data</td>
                      <td className="py-2 pl-4">Session-scoped only — deleted when the analysis session ends</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">Analysis Output</td>
                      <td className="py-2 pl-4">Until you delete it from the dashboard, or 30 days after account termination</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">Usage Data</td>
                      <td className="py-2 pl-4">Up to 24 months in anonymized/aggregated form</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">Billing Data</td>
                      <td className="py-2 pl-4">7 years from the date of transaction (tax compliance)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-foreground">Technical Data</td>
                      <td className="py-2 pl-4">Up to 12 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Upon account deletion, we initiate removal of your Personal Data within 30 days, except where retention is required for legal compliance (such as billing records for tax purposes).
            </p>
          </section>

          {/* Section 10: Data Security */}
          <section id="security">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              10. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement technical and organizational measures to protect your information, including:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-medium text-foreground mb-1">Encryption at Rest</h3>
                <p className="text-muted-foreground text-sm">AES-256 encryption for stored data</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-medium text-foreground mb-1">Encryption in Transit</h3>
                <p className="text-muted-foreground text-sm">TLS 1.3 for all data in transit</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-medium text-foreground mb-1">Access Controls</h3>
                <p className="text-muted-foreground text-sm">Role-based access with least-privilege principles</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="font-medium text-foreground mb-1">Isolated Processing</h3>
                <p className="text-muted-foreground text-sm">Session-scoped, sandboxed analysis environments</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔑</div>
                <h3 className="font-medium text-foreground mb-1">Credential Scoping</h3>
                <p className="text-muted-foreground text-sm">Per-session authentication with no ambient credentials</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-medium text-foreground mb-1">Security Assessments</h3>
                <p className="text-muted-foreground text-sm">Regular security reviews of infrastructure and processes</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              No method of electronic storage or transmission is 100% secure. While we strive to use commercially reasonable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 11: Your Privacy Rights */}
          <section id="rights">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              11. Your Privacy Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your rights depend on your location and the applicable data protection laws.
            </p>
            <div className="space-y-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-3">11.1 European Economic Area, UK, and Switzerland (GDPR)</h3>
                <p className="text-muted-foreground text-sm mb-2">If you are located in the EEA, UK, or Switzerland, you have the following rights:</p>
                <ul className="text-muted-foreground text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right of Access:</strong> Request a copy of the Personal Data we hold about you.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Rectification:</strong> Request correction of inaccurate or incomplete Personal Data.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your Personal Data, subject to legal retention requirements.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Restriction:</strong> Request that we restrict processing of your Personal Data in certain circumstances.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Data Portability:</strong> Receive your Personal Data in a structured, machine-readable format.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Rights Related to Automated Decision-Making:</strong> Request human review of AI-generated findings and contest automated decisions that significantly affect you.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Lodge a Complaint:</strong> File a complaint with your local supervisory authority.</span></li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-3">11.2 California (CCPA/CPRA)</h3>
                <p className="text-muted-foreground text-sm mb-2">If you are a California resident, you have the following rights:</p>
                <ul className="text-muted-foreground text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Know:</strong> Request disclosure of the categories and specific pieces of Personal Data we have collected about you.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Delete:</strong> Request deletion of your Personal Data, subject to certain exceptions.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Opt-Out of Sale:</strong> We do not sell your Personal Data. If this changes, we will provide a "Do Not Sell My Personal Information" mechanism.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</span></li>
                </ul>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="text-lg font-medium text-foreground mb-3">11.3 Exercising Your Rights</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To exercise any of the rights described above, contact us at{" "}
                  <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">hello@solarizer.io</a>.
                  We will respond to verifiable requests within 30 days (or the time period required by applicable law). We may request additional information to verify your identity before processing your request.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Cookies & Tracking Technologies */}
          <section id="cookies">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              12. Cookies & Tracking Technologies
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">12.1 What We Use</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">The Solarizer website and dashboard use the following technologies:</p>
                <ul className="text-muted-foreground text-sm space-y-2 ml-2">
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Essential Cookies:</strong> Required for the Service to function, including authentication tokens and session management. These cannot be disabled.</span></li>
                  <li className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span><strong className="text-foreground">Analytics Cookies:</strong> Used to understand how users interact with the Service and to improve performance and features. These are anonymized where possible.</span></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">12.2 Managing Preferences</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can manage cookie preferences through your browser settings. Disabling essential cookies may prevent certain features of the Service from functioning correctly.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">12.3 Do Not Track</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The Service does not currently respond to "Do Not Track" (DNT) browser signals. However, you may opt out of analytics tracking as described above.
                </p>
              </div>
            </div>
          </section>

          {/* Section 13: Children's Privacy */}
          <section id="children">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              13. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not directed to individuals under the age of 18 (or the age of legal majority in their jurisdiction). We do not knowingly collect Personal Data from children. If we become aware that we have collected Personal Data from a child without parental consent, we will take steps to delete that information promptly. If you believe we have collected information from a child, contact us at{" "}
              <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">hello@solarizer.io</a>.
            </p>
          </section>

          {/* Section 14: Changes to This Policy */}
          <section id="changes">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              14. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes, we will:
            </p>
            <ol className="text-muted-foreground text-sm space-y-2 ml-6 list-decimal">
              <li>Update the "Last updated" date at the top of this page.</li>
              <li>Post a prominent notice on the Service or send notification to the email address associated with your account.</li>
              <li>Where required by applicable law, obtain your consent to material changes before they take effect.</li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We encourage you to review this Privacy Policy periodically. Your continued use of the Service after the effective date of an updated Policy constitutes your acknowledgment of the changes.
            </p>
          </section>

          {/* Section 15: Contact & Data Protection */}
          <section id="contact">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">
              15. Contact & Data Protection
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For questions about this Privacy Policy, to exercise your privacy rights, or to raise a concern about our data practices, contact:
            </p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-4">
              <p className="text-foreground font-medium">Solarizer</p>
              <p className="text-muted-foreground text-sm">
                Email:{" "}
                <a href="mailto:hello@solarizer.io" className="text-primary hover:underline">hello@solarizer.io</a>
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We aim to respond to all privacy-related inquiries within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection supervisory authority.
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
