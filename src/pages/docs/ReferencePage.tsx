import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LayoutDashboard } from "lucide-react";

const ReferencePage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Dashboard Reference</h2>
      <p className="text-sm text-muted-foreground mt-1">Actions available from the Solarizer dashboard</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          Available Actions
        </CardTitle>
        <CardDescription>Quick reference for dashboard features and where to find them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { action: "New Audit", location: "Dashboard", desc: "Start a new security analysis using the guided wizard" },
              { action: "View Report", location: "Dashboard / Analyses", desc: "Click any audit to view its full security report" },
              { action: "Export Report", location: "Report page", desc: "Download your report as a markdown file (Blaze and above)" },
              { action: "Share Report", location: "Report page", desc: "Share a report with collaborators via email (Inferno)" },
              { action: "Toggle Public", location: "Report page", desc: "Make a report publicly accessible via a shareable link" },
              { action: "Buy Credits", location: "Dashboard / Billing", desc: "Purchase additional power-up credits for larger audits" },
              { action: "Manage Plan", location: "Settings → Billing", desc: "Upgrade, downgrade, or cancel your subscription" },
            ].map((row) => (
              <TableRow key={row.action}>
                <TableCell className="font-medium">{row.action}</TableCell>
                <TableCell className="text-muted-foreground">{row.location}</TableCell>
                <TableCell className="text-muted-foreground">{row.desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default ReferencePage;
