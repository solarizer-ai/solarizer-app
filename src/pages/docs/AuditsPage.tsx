import { Wand2, Cpu, FileCheck } from "lucide-react";
import { Code } from "@/components/docs/DocHelpers";

const wizardSteps = [
  { step: "1", title: "Project Name", desc: "Enter a name for your audit project." },
  { step: "2", title: "Upload Method", desc: "Choose how to provide your contracts — upload a local folder or import from a GitHub repository." },
  { step: "3", title: "Upload Files", desc: <>Upload your Solidity files or select a repository and branch. Only <Code>.sol</Code> files are analyzed.</> },
  { step: "4", title: "Scope Selection", desc: <>Choose which files to include in audit scope and which are context. Scope files are charged at full rate; context files at the <Code>0.15x</Code> discount.</> },
  { step: "5", title: "Complexity & Cost", desc: "Review the estimated nLOC, complexity classification, and total credit cost. Plan-specific nLOC limits apply: 500 (Spark), 3,000 (Blaze), 9,999 (Inferno)." },
  { step: "6", title: "Additional Context", desc: "Optionally add notes or documentation to help the analysis engine understand your contracts.", optional: true },
];

const analysisPhases: { step: string; title: string; desc: string; plans: "all" | "blaze" }[] = [
  { step: "1", title: "Complexity Estimation", desc: "Classifies each contract as L1 (Standard), L2 (Complex), or L3 (Novel) based on code patterns.", plans: "all" },
  { step: "2", title: "Hunting (P1)", desc: "Broad vulnerability sweep across all contracts. Detects Critical, High, and Medium severity findings.", plans: "all" },
  { step: "3", title: "Hunting (P2)", desc: "Second pass on L2+ contracts with deeper pattern matching and extended analysis.", plans: "blaze" },
  { step: "4", title: "Cross-Contract Analysis", desc: "Examines contract interactions — reentrancy chains, trust boundaries, and shared state.", plans: "blaze" },
  { step: "5", title: "AI Validation", desc: "Re-examines each finding with a secondary model, rejecting false positives and adjusting severity.", plans: "blaze" },
  { step: "6", title: "QA Scan", desc: "Gas optimizations, informational issues, and low-severity findings.", plans: "blaze" },
  { step: "7", title: "Formatting", desc: "Maps findings to exact source lines and generates your final report.", plans: "all" },
];

const PlanTag = ({ plans }: { plans: "all" | "blaze" }) =>
  plans === "all" ? (
    <span className="text-xs text-green-500/80 font-medium">All plans</span>
  ) : (
    <span className="text-xs text-primary/80 font-medium">Blaze &amp; Inferno</span>
  );

const AuditsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Running an Audit</h1>
      <p className="text-muted-foreground mt-1">The guided audit wizard walks you through each step</p>
    </div>

    <p className="text-sm text-muted-foreground/60">
      Solarizer uses a step-by-step wizard to configure and launch your audit. Each step validates before advancing, so you can review costs and scope before committing any credits.
    </p>

    {/* Audit Wizard */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Audit Wizard</h2>
      </div>
      <div className="space-y-4">
        {wizardSteps.map((item) => (
          <div key={item.step} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">{item.step}</span>
            </div>
            <div>
              {item.optional ? (
                <h4 className="font-medium">
                  {item.title}{" "}
                  <span className="text-muted-foreground/60 font-normal text-xs">(Optional)</span>
                </h4>
              ) : (
                <h4 className="font-medium">{item.title}</h4>
              )}
              <p className="text-sm text-muted-foreground/60">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Analysis Engine */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Analysis Engine</h2>
      </div>
      <div className="space-y-4">
        {analysisPhases.map((phase) => (
          <div key={phase.step} className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">{phase.step}</span>
            </div>
            <div>
              <h4 className="font-medium">{phase.title}</h4>
              <p className="text-sm text-muted-foreground/60">
                {phase.desc}{" "}
                <PlanTag plans={phase.plans} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* After Your Audit */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">After Your Audit</h2>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground/60">
        <p>
          Your report is available on the dashboard immediately after the audit completes. It includes your <strong className="text-foreground">security grade</strong>, a <strong className="text-foreground">findings summary</strong> organized by severity, and the full detailed report.
        </p>
        <p>
          You can download the report as a local markdown file on any plan.
        </p>
        <p>
          Learn how grades are determined in the{" "}
          <a href="/docs/grades" className="text-primary hover:underline">grades documentation</a>.
        </p>
      </div>
    </div>
  </div>
);

export default AuditsPage;
