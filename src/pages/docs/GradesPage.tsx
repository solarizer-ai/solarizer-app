import { Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { DocTable } from "@/components/docs/DocHelpers";

const grades = [
  { grade: "A", criteria: "No vulnerabilities", desc: "Only gas optimizations or informational findings (or no findings at all)", color: "text-success" },
  { grade: "B", criteria: "Low severity only", desc: "Minor issues with no medium, high, or critical findings", color: "text-success" },
  { grade: "C", criteria: "Medium severity found", desc: "At least one medium-severity vulnerability present", color: "text-warning" },
  { grade: "D", criteria: "High severity found", desc: "At least one high-severity vulnerability present", color: "text-warning" },
  { grade: "F", criteria: "Critical found", desc: "At least one critical vulnerability — immediate action required", color: "text-critical" },
];

const guidance = [
  { grade: "A", color: "text-success", text: "Your contracts look clean. Consider a final manual review for business logic before deployment." },
  { grade: "B", color: "text-success", text: "Only low-severity issues found. Review each finding and address any that affect your specific use case." },
  { grade: "C", color: "text-warning", text: "Medium-severity issues present. Fix these before deployment — they may not be immediately exploitable but weaken your security posture." },
  { grade: "D", color: "text-warning", text: "High-severity vulnerabilities detected. These are exploitable under certain conditions — prioritize fixes before any mainnet deployment." },
  { grade: "F", color: "text-critical", text: "Critical vulnerabilities found. Do not deploy. Fix all critical issues and re-run the audit." },
];

const GradesPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security Grades</h1>
      <p className="text-muted-foreground mt-1">Understanding your audit grade</p>
    </div>

    <p className="text-sm text-muted-foreground/60">
      Your audit grade is determined by the highest severity finding in your report. A clean codebase with no vulnerabilities earns an A; a single critical finding results in an F.
    </p>

    {/* Grade Scale */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Grade Scale</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {grades.map((item) => (
          <div key={item.grade} className="text-center bg-foreground/[0.02] border border-border/10 rounded-xl p-4">
            <div className={`text-3xl font-black ${item.color}`}>{item.grade}</div>
            <div className="text-xs text-muted-foreground mt-1">{item.criteria}</div>
            <div className="text-xs text-muted-foreground/60 mt-2">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Severity Levels */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Severity Levels</h2>
      </div>
      <DocTable
        headers={["Severity", "Description", "Availability"]}
        rows={[
          [<strong className="text-foreground">Critical</strong>, "Exploitable vulnerabilities that can lead to loss of funds or complete contract compromise", "All plans"],
          [<strong className="text-foreground">High</strong>, "Serious vulnerabilities that could be exploited under specific conditions", "All plans"],
          [<strong className="text-foreground">Medium</strong>, "Issues that could lead to unexpected behavior or reduced security guarantees", "All plans"],
          [<strong className="text-foreground">Low</strong>, "Minor issues with limited impact, often related to best practices", "Blaze & Inferno"],
          [<strong className="text-foreground">Info</strong>, "Informational observations about code structure, patterns, or documentation", "Blaze & Inferno"],
          [<strong className="text-foreground">Gas</strong>, "Gas optimization opportunities that can reduce transaction costs", "Blaze & Inferno"],
        ]}
      />
      <p className="text-sm text-muted-foreground/60 mt-4">
        Spark plans show Critical, High, and Medium findings. Upgrade to Blaze or Inferno to see Low, Info, and Gas severity findings.
      </p>
    </div>

    {/* Improving Your Grade */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Improving Your Grade</h2>
      </div>
      <div className="space-y-3">
        {guidance.map((item) => (
          <div key={item.grade} className="flex gap-3">
            <span className={`text-sm font-bold ${item.color} w-6 shrink-0`}>{item.grade}</span>
            <p className="text-sm text-muted-foreground/60">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default GradesPage;
