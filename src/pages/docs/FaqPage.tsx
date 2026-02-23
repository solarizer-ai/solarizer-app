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
      "Simple: 1 credit allows you to audit exactly 1 line of Solidity code. It's the fuel for your smart contract's security.",
  },
  {
    question: "What exactly counts towards my credit limit?",
    answer:
      "Every line of code in the files you upload is scanned and counted towards your quota. This includes imports and external libraries if they are present in the file. Tip: To save credits, we recommend flattening your contracts or only uploading your core logic files.",
  },
  {
    question: "What happens to my credits if I switch plans?",
    answer:
      "Your credit balance is yours. If you Upgrade your plan, your existing balance is maintained 1:1. If you Downgrade, credits are converted based on the Credit Fair Usage Policy to preserve their monetary value.",
  },
  {
    question: "Do my credits expire?",
    answer:
      "No. Credits remain in your account forever until used. They never expire as long as you maintain an active subscription.",
  },
  {
    question: "Can I buy credits without a subscription?",
    answer:
      "No. You need an active subscription (Spark, Blaze, or Inferno) to access the Solarizer analysis engine. However, you can buy as many credits as you need on top of any active plan.",
  },
  {
    question: "Why can't I see remediation recommendations on the Launch Plan?",
    answer:
      "The Launch Plan is a starter tier designed to help you identify vulnerabilities. To access AI-driven remediation and report exports, you will need to upgrade to the Pro Plan.",
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
