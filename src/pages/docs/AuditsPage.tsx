import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AuditsPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Running an Audit</h2>
      <p className="text-sm text-muted-foreground mt-1">The 6-step guided audit wizard</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Audit Wizard
        </CardTitle>
        <CardDescription>Follow the guided steps to run a security audit</CardDescription>
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
  </div>
);

export default AuditsPage;
