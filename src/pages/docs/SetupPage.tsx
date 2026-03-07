import { CheckCircle2, Rocket } from "lucide-react";

const SetupPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Getting Started</h1>
      <p className="text-muted-foreground mt-1">Get up and running in under 2 minutes</p>
    </div>

    {/* What You'll Need */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">What You'll Need</h2>
      </div>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground/60">
        <li>An active Solarizer subscription (Inferno plan — $99/mo)</li>
        <li>Solidity source files (.sol) — either as a local folder or in a GitHub repository</li>
      </ul>
    </div>

    {/* Quick Start */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Quick Start</h2>
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">1</span>
          </div>
          <div>
            <h4 className="font-medium">Create Your Account</h4>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Sign up at <strong className="text-foreground">solarizer.io</strong> to create your account and access the dashboard.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">2</span>
          </div>
          <div>
            <h4 className="font-medium">Choose a Plan</h4>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Subscribe to the <strong className="text-foreground">Inferno plan ($99/mo)</strong> to unlock the analysis engine. Includes 500 monthly credits with $0.10/credit top-ups.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">3</span>
          </div>
          <div>
            <h4 className="font-medium">Start Your First Audit</h4>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Click <strong className="text-foreground">New Audit</strong> from the dashboard. Upload a folder of Solidity contracts or import directly from a GitHub repository, then follow the guided wizard.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">4</span>
          </div>
          <div>
            <h4 className="font-medium">Review Your Report</h4>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Once the analysis completes, your dashboard shows the audit grade, findings summary, and full report. You can also download the report as a local markdown file.
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="text-sm text-muted-foreground/60">
      Ready to dive deeper? Learn about the{" "}
      <a href="/docs/audits" className="text-primary hover:underline">audit wizard and analysis phases</a>.
    </p>
  </div>
);

export default SetupPage;
