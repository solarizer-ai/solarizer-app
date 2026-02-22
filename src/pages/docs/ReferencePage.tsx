import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Terminal } from "lucide-react";

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{children}</code>
);

const ReferencePage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Dashboard Reference</h2>
      <p className="text-sm text-muted-foreground mt-1">Actions available from the Solarizer dashboard</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          Available Actions
        </CardTitle>
        <CardDescription>Quick reference for dashboard actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { action: "Start Audit", section: "Audits", desc: "Launch the guided audit wizard" },
              { action: "Resume Audit", section: "Audits", desc: "Continue an in-progress audit session" },
              { action: "Theme", section: "Settings", desc: "Toggle between light and dark mode" },
              { action: "Auth", section: "Settings", desc: "Manage your API key and authentication" },
              { action: "Editor", section: "Settings", desc: "Configure your preferred code editor" },
              { action: "Permissions", section: "Settings", desc: "Manage file system access permissions" },
            ].map((row) => (
              <TableRow key={row.action}>
                <TableCell className="font-medium">{row.action}</TableCell>
                <TableCell className="text-muted-foreground">{row.section}</TableCell>
                <TableCell className="text-muted-foreground">{row.desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><Code>↑</Code> <Code>↓</Code> Navigate items &nbsp;&nbsp; <Code>Enter</Code> Select &nbsp;&nbsp; <Code>Esc</Code> Back</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default ReferencePage;
