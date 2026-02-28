import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AuditsPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Running an Audit</h2>
      <p className="text-sm text-muted-foreground mt-1">The guided audit wizard walks you through each step</p>
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
            { step: "1", title: "Project Name", desc: "Enter a name for your audit project." },
            { step: "2", title: "Upload Method", desc: "Choose how to provide your contracts — upload a folder or connect a GitHub repository." },
            { step: "3", title: "Upload Files", desc: "Upload your Solidity files or select a repository and branch." },
            { step: "4", title: "Scope Selection", desc: "Choose which files to include in the audit scope. Supporting files can be marked as context." },
            { step: "5", title: "Complexity Estimate & Cost", desc: "Review the estimated nLOC, complexity level, and credit cost before proceeding." },
            { step: "6", title: "Additional Context", desc: "Optionally add notes or documentation to help the analysis engine understand your contracts." },
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
          <h4 className="font-medium mb-3">Analysis Phases</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Once you confirm, Solarizer runs your audit through 7 phases:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Preparing — setting up the analysis environment",
              "Hunting — deep vulnerability detection across your contracts",
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
