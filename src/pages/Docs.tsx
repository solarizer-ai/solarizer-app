import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, Code, Shield, Zap, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is a Power up Credit?",
    answer:
      "Simple: 1 Power up Credit allows you to audit exactly 1 line of Solidity code. It's the fuel for your smart contract's security.",
  },
  {
    question: "What exactly counts towards my Power up Credit limit?",
    answer:
      "Every line of code in the files you upload is scanned and counted towards your quota. This includes imports and external libraries if they are present in the file. Tip: To save credits, we recommend flattening your contracts or only uploading your core logic files.",
  },
  {
    question: "What happens to my credits if I switch plans?",
    answer:
      "Your credit balance is yours. If you Upgrade your plan, your existing balance is maintained 1:1. If you Downgrade, credits are converted based on the Credit Fair Usage Policy to preserve their monetary value.",
  },
  {
    question: "Do my Power up Credits expire?",
    answer:
      "No. Power up Credits remain in your account forever until used. They never expire as long as you maintain an active subscription.",
  },
  {
    question: "Can I buy Power ups without a subscription?",
    answer:
      "No. You need an active subscription (Launch, Pro, or Business) to access the Solarizer analysis engine. However, you can buy as many Power ups as you need on top of any active plan.",
  },
  {
    question: "Why can't I see remediation recommendations on the Launch Plan?",
    answer:
      "The Launch Plan is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation, the interactive code editor, and report exports, you will need to upgrade to the Pro Plan.",
  },
  {
    question: "How does the Annual Discount work?",
    answer:
      "If you choose Annual billing for the Pro or Business plans, you pay for 10 months and get 2 months free. The Launch Plan does not offer an annual discount.",
  },
  {
    question: "What is Security Coverage and how is it different from \"Findings\"?",
    answer:
      "\"Findings\" only show you what is broken. Security Coverage shows you everything we checked to ensure it was safe. It is a complete ledger of all security hypotheses—such as \"Does this contract have reentrancy protection?\"—and their results.",
  },
  {
    question: "Why is this important for me?",
    answer:
      "It provides transparency and trust. Instead of wondering if an auditor simply missed a bug, you can see a line-by-line verification that specific risks (like Integer Overflows or Access Control failures) were tested and passed.",
  },
  {
    question: "What does a \"PASSED\" test mean in the coverage?",
    answer:
      "A \"PASSED\" status means the engine specifically analyzed that vector and found the contract to be secure against it. For these tests, we provide Proof—a brief explanation of why that specific logic is safe (e.g., \"Uses OpenZeppelin's ReentrancyGuard\").",
  },
  {
    question: "What happens when a test \"FAILS\"?",
    answer:
      "If a test fails, it is automatically linked to a detailed Finding. You can click the \"View Issue\" button next to any failed test to see the exact line of code, the severity of the risk, and the recommended fix.",
  },
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Documentation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn how to use Solarizer for smart contract security analysis
            </p>
          </div>

          <Tabs defaultValue="getting-started" className="space-y-6">
            <TabsList>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get started with Solarizer in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Upload Your Contract</h4>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your .sol files or paste your Solidity code directly into the editor.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Start Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Start Analysis" to begin the automated security scan of your contract.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Review Findings</h4>
                        <p className="text-sm text-muted-foreground">
                          Examine the detailed security report with vulnerability descriptions and remediation guides.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Grades
                  </CardTitle>
                  <CardDescription>
                    Understanding your security score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { grade: 'A', range: '85-100%', desc: 'Excellent security posture' },
                      { grade: 'B', range: '70-84%', desc: 'Good with minor issues' },
                      { grade: 'C', range: '60-69%', desc: 'Moderate vulnerabilities' },
                      { grade: 'D', range: '50-59%', desc: 'Significant concerns' },
                      { grade: 'F', range: '0-49%', desc: 'Critical issues found' },
                    ].map((item) => (
                      <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
                        <div className={`text-2xl font-bold ${
                          item.grade === 'A' || item.grade === 'B' ? 'text-success' :
                          item.grade === 'C' ? 'text-warning' : 'text-destructive'
                        }`}>
                          {item.grade}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{item.range}</div>
                        <div className="text-xs mt-2">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vulnerabilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Common Vulnerabilities
                  </CardTitle>
                  <CardDescription>
                    Security issues Solarizer detects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Reentrancy', severity: 'Critical', desc: 'External calls that allow recursive function invocation before state updates.' },
                    { name: 'Integer Overflow/Underflow', severity: 'High', desc: 'Arithmetic operations that exceed variable bounds.' },
                    { name: 'Access Control', severity: 'High', desc: 'Missing or improper authorization checks on sensitive functions.' },
                    { name: 'Unchecked External Calls', severity: 'Medium', desc: 'External calls without proper return value validation.' },
                    { name: 'Front-Running', severity: 'Medium', desc: 'Transaction ordering manipulation vulnerabilities.' },
                  ].map((vuln) => (
                    <div key={vuln.name} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        vuln.severity === 'Critical' ? 'bg-critical/10 text-critical' :
                        vuln.severity === 'High' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {vuln.severity}
                      </div>
                      <div>
                        <h4 className="font-medium">{vuln.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{vuln.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="best-practices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    Security Best Practices
                  </CardTitle>
                  <CardDescription>
                    Recommended patterns for secure smart contracts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'Use Checks-Effects-Interactions', desc: 'Always update state before making external calls to prevent reentrancy.' },
                    { title: 'Implement Access Control', desc: 'Use OpenZeppelin\'s Ownable or AccessControl for role-based permissions.' },
                    { title: 'Validate All Inputs', desc: 'Check for zero addresses, valid ranges, and expected values in all functions.' },
                    { title: 'Use SafeMath (pre-0.8)', desc: 'For Solidity versions before 0.8, use SafeMath for arithmetic operations.' },
                    { title: 'Emit Events', desc: 'Log all important state changes for transparency and off-chain tracking.' },
                    { title: 'Regular Security Reviews', desc: 'Schedule periodic security reviews, especially before major releases.' },
                  ].map((practice, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{practice.title}</h4>
                        <p className="text-sm text-muted-foreground">{practice.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Secure Pattern Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`// Secure withdrawal pattern
function withdraw(uint256 amount) external nonReentrant {
    // 1. Checks
    require(balances[msg.sender] >= amount, "Insufficient");
    
    // 2. Effects (state change FIRST)
    balances[msg.sender] -= amount;
    
    // 3. Interactions (external call LAST)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    
    emit Withdrawal(msg.sender, amount);
}`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Common questions about Solarizer, credits, and security coverage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-3">
                    {faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="border border-border/50 rounded-lg px-4 bg-muted/20 hover:border-primary/30 transition-colors data-[state=open]:border-primary/50 data-[state=open]:bg-muted/40"
                      >
                        <AccordionTrigger className="text-left font-medium py-4 hover:text-primary hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Docs;
