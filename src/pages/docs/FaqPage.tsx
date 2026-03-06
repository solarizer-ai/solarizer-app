import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is a credit?",
    answer:
      "Credits are the currency for running audits. Each credit covers one normalized line of code (nLOC) — that's your source code excluding comments and blank lines. The actual cost per audit also depends on complexity: L1 contracts use 0.8× credits, L2 use 1.0×, and L3 use 1.2×. Context files are charged at a reduced 0.15× rate.",
  },
  {
    question: "What exactly counts towards my credit cost?",
    answer:
      "Only the Solidity files you include in your audit scope are counted. The nLOC (normalized lines of code) is calculated by stripping comments and whitespace, then applying the complexity multiplier for each file. Context files (interfaces, libraries) are counted at a reduced rate of 15%.",
  },
  {
    question: "What happens to my credits if I switch plans?",
    answer:
      "If you upgrade, your existing credit balance is maintained 1:1. If you downgrade, credits are converted using the Credit Fair Usage Policy — your balance is recalculated based on the ratio of credit rates between plans to preserve their monetary value.",
  },
  {
    question: "Do my credits expire?",
    answer:
      "No. Credits remain in your account until used. They never expire as long as you maintain an active subscription.",
  },
  {
    question: "Can I buy credits without a subscription?",
    answer:
      "No. You need an active subscription (Spark, Blaze, or Inferno) to access the Solarizer analysis engine. However, you can purchase additional credits at any time on top of your plan.",
  },
  {
    question: "Why can't I see remediation recommendations on the Spark plan?",
    answer:
      "Spark is a starter tier designed to help you identify vulnerabilities. You can download your report as a local markdown file on all plans. To access AI-driven remediation guidance, Low/Info/Gas severity findings, and deeper analysis phases, upgrade to Blaze.",
  },
  {
    question: "How long does an audit take?",
    answer:
      "Most audits complete in 3-8 minutes for contracts under 500 nLOC. Larger scopes with multiple contracts can take up to 15 minutes. The 7-phase analysis engine runs automatically — you can close the browser and check back later.",
  },
  {
    question: "What file formats are supported?",
    answer:
      "Solarizer analyzes Solidity (.sol) files. You can upload a folder of contracts directly or import from a GitHub repository.",
  },
  {
    question: "Can I re-run an audit on the same contracts?",
    answer:
      "Yes. Each audit run is independent and costs credits based on the scope at the time. If you've updated your contracts, simply start a new audit to analyze the latest version.",
  },
  {
    question: "What is nLOC?",
    answer:
      "Normalized Lines of Code — your source code with comments and blank lines removed. This is the metric used to calculate audit costs, ensuring you only pay for actual code.",
  },
  {
    question: "Is my source code stored after the audit?",
    answer:
      "No. Your source code is processed in memory during the audit and purged after completion. Only the audit report and metadata are retained in your dashboard.",
  },
];

const FaqPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mt-1">Common questions about Solarizer and credits</p>
    </div>
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="border border-border/10 rounded-lg px-4 bg-foreground/[0.02]"
        >
          <AccordionTrigger className="text-left font-medium py-4 hover:text-primary hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground/60 pb-4">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export default FaqPage;
