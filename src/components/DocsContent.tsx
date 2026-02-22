import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Shield, HelpCircle, Terminal } from "lucide-react";

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
      "The Launch Plan is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation and report exports, you will need to upgrade to the Pro Plan.",
  },
];

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{children}</code>
);

const DocsContent = () => {
  return (
    <Tabs defaultValue="getting-started" className="space-y-6">
      <TabsList>
        <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>

      <TabsContent value="getting-started" className="space-y-6">
        {/* Card 1: Installation & Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Installation & Setup
            </CardTitle>
            <CardDescription>Get up and running in under 2 minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Install the CLI</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run <Code>npm install -g @solarizer/cli</Code> to install Solarizer globally.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Launch & Authenticate</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run <Code>solarizer</Code> and paste your API key when prompted. Alternatively, set the <Code>SOLARIZER_API_KEY</Code> environment variable to skip the prompt.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-medium">You're on the Dashboard</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate with <Code>↑</Code> <Code>↓</Code> arrow keys and select with <Code>Enter</Code>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Running an Audit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Running an Audit
            </CardTitle>
            <CardDescription>The 6-step guided audit wizard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { step: "1", title: "Start Audit", desc: "Select \"Start Audit\" from the dashboard menu." },
                { step: "2", title: "Project Name", desc: "Enter a name for your audit project." },
                { step: "3", title: "Select Scope Files", desc: "Choose the Solidity files to include in the audit scope." },
                { step: "4", title: "Context Files", desc: "Optionally add supporting files that provide context (interfaces, libraries)." },
                { step: "5", title: "Additional Context", desc: "Add any extra notes or documentation the auditor should consider." },
                { step: "6", title: "Complexity Estimate", desc: "Review the estimated complexity and line count for your audit." },
                { step: "7", title: "Cost Confirmation", desc: "Confirm the credit cost and start the analysis." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3">What happens next</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Hunting — deep vulnerability detection",
                  "Cross-Contract — inter-contract interaction analysis",
                  "Validation — confirming findings with secondary checks",
                  "QA Scan — code quality and best-practice review",
                  "Formatting — structuring results into a readable report",
                  "Report Generation — final report with grades and remediation",
                ].map((phase) => (
                  <li key={phase} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{phase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Security Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Grades
            </CardTitle>
            <CardDescription>Understanding your security score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { grade: "A", range: "85-100%", desc: "Excellent security posture" },
                { grade: "B", range: "70-84%", desc: "Good with minor issues" },
                { grade: "C", range: "60-69%", desc: "Moderate vulnerabilities" },
                { grade: "D", range: "50-59%", desc: "Significant concerns" },
                { grade: "F", range: "0-49%", desc: "Critical issues found" },
              ].map((item) => (
                <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
                  <div
                    className={`text-2xl font-bold ${
                      item.grade === "A" || item.grade === "B"
                        ? "text-success"
                        : item.grade === "C"
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {item.grade}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{item.range}</div>
                  <div className="text-xs mt-2">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Dashboard Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Dashboard Reference
            </CardTitle>
            <CardDescription>Actions available from the Solarizer dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { action: "Start Audit", section: "Audits", desc: "Launch the guided audit wizard" },
                  { action: "Resume Audit", section: "Audits", desc: "Continue an in-progress audit session" },
                  { action: "Theme", section: "Settings", desc: "Toggle between light and dark mode" },
                  { action: "Auth", section: "Settings", desc: "Manage your API key and authentication" },
                  { action: "Editor", section: "Settings", desc: "Configure your preferred code editor" },
                  { action: "Permissions", section: "Settings", desc: "Manage file system access permissions" },
                ].map((row) => (
                  <TableRow key={row.action}>
                    <TableCell className="font-medium">{row.action}</TableCell>
                    <TableCell className="text-muted-foreground">{row.section}</TableCell>
                    <TableCell className="text-muted-foreground">{row.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><Code>↑</Code> <Code>↓</Code> Navigate items &nbsp;&nbsp; <Code>Enter</Code> Select &nbsp;&nbsp; <Code>Esc</Code> Back</p>
            </div>
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
              Common questions about Solarizer and credits
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
  );
};

export default DocsContent;
