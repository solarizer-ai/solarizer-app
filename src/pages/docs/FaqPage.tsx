import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is a credit?",
    answer:
      "Credits are the currency for running audits. Each credit covers one normalized line of code (nLOC) — that's your source code excluding comments and blank lines. The actual cost per audit also depends on complexity: L1 contracts use 0.83× credits, L2 use 1.0×, and L3 use 1.2×. Context files are charged at a reduced 0.15× rate.",
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
      "No. You need an active subscription (Spark, Blaze, or Inferno) to access the Solarizer analysis engine. However, you can purchase additional power-up credits at any time on top of your plan.",
  },
  {
    question: "Why can't I see remediation recommendations on the Spark plan?",
    answer:
      "Spark is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation guidance, report exports, and Low/Info/Gas severity findings, upgrade to the Blaze plan.",
  },
];

const FaqPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
      <p className="text-sm text-muted-foreground mt-1">Common questions about Solarizer and credits</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          FAQ
        </CardTitle>
        <CardDescription>Find answers to common questions</CardDescription>
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
  </div>
);

export default FaqPage;
