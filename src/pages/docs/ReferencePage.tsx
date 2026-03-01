import { Shield, FileText, CreditCard } from "lucide-react";
import { DocTable } from "@/components/docs/DocHelpers";

const ReferencePage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard Reference</h1>
      <p className="text-muted-foreground mt-1">Actions available from the Solarizer dashboard</p>
    </div>

    {/* Audit Management */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Audit Management</h2>
      </div>
      <DocTable
        headers={["Action", "Location", "Description"]}
        rows={[
          [
            <strong className="text-foreground">New Audit</strong>,
            <span className="text-sm text-muted-foreground/60">Dashboard</span>,
            <span className="text-sm text-muted-foreground/60">Start a new security analysis using the guided audit wizard</span>,
          ],
          [
            <strong className="text-foreground">View Report</strong>,
            <span className="text-sm text-muted-foreground/60">{"Dashboard \u2192 Analyses"}</span>,
            <span className="text-sm text-muted-foreground/60">Click any completed audit to view its full security report</span>,
          ],
        ]}
      />
    </div>

    {/* Report Actions */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Report Actions</h2>
      </div>
      <DocTable
        headers={["Action", "Location", "Description"]}
        rows={[
          [
            <strong className="text-foreground">Export Report</strong>,
            <span className="text-sm text-muted-foreground/60">Report page</span>,
            <span className="text-sm text-muted-foreground/60">Download your report as a markdown file (all plans)</span>,
          ],
          [
            <strong className="text-foreground">Share Report</strong>,
            <span className="text-sm text-muted-foreground/60">Report page</span>,
            <span className="text-sm text-muted-foreground/60">Share a report with collaborators via email (Inferno)</span>,
          ],
          [
            <strong className="text-foreground">Toggle Public</strong>,
            <span className="text-sm text-muted-foreground/60">Report page</span>,
            <span className="text-sm text-muted-foreground/60">Make a report publicly accessible via a shareable link</span>,
          ],
        ]}
      />
    </div>

    {/* Account & Billing */}
    <div className="bg-foreground/[0.02] border border-border/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Account & Billing</h2>
      </div>
      <DocTable
        headers={["Action", "Location", "Description"]}
        rows={[
          [
            <strong className="text-foreground">Buy Credits</strong>,
            <span className="text-sm text-muted-foreground/60">{"Dashboard \u2192 Billing"}</span>,
            <span className="text-sm text-muted-foreground/60">Purchase additional power-up credits for larger audits</span>,
          ],
          [
            <strong className="text-foreground">Manage Plan</strong>,
            <span className="text-sm text-muted-foreground/60">{"Settings \u2192 Billing"}</span>,
            <span className="text-sm text-muted-foreground/60">Upgrade, downgrade, or cancel your subscription</span>,
          ],
          [
            <strong className="text-foreground">GitHub Integration</strong>,
            <span className="text-sm text-muted-foreground/60">{"Settings \u2192 Integrations"}</span>,
            <span className="text-sm text-muted-foreground/60">Connect your GitHub account to import repositories directly</span>,
          ],
          [
            <strong className="text-foreground">Credit History</strong>,
            <span className="text-sm text-muted-foreground/60">{"Dashboard \u2192 Credits"}</span>,
            <span className="text-sm text-muted-foreground/60">View your credit balance, usage history, and monthly allocations</span>,
          ],
        ]}
      />
    </div>
  </div>
);

export default ReferencePage;
