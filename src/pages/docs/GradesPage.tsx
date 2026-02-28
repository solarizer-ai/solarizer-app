import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const GradesPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Security Grades</h2>
      <p className="text-sm text-muted-foreground mt-1">Understanding your audit grade</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Grade Breakdown
        </CardTitle>
        <CardDescription>Grades are determined by the highest severity finding in your audit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { grade: "A", criteria: "No vulnerabilities", desc: "Only gas optimizations or informational findings (or no findings at all)" },
            { grade: "B", criteria: "Low severity only", desc: "Minor issues with no medium, high, or critical findings" },
            { grade: "C", criteria: "Medium severity found", desc: "At least one medium-severity vulnerability present" },
            { grade: "D", criteria: "High severity found", desc: "At least one high-severity vulnerability present" },
            { grade: "F", criteria: "Critical found", desc: "At least one critical vulnerability — immediate action required" },
          ].map((item) => (
            <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
              <div
                className={`text-2xl font-bold ${
                  item.grade === "A" || item.grade === "B"
                    ? "text-success"
                    : item.grade === "C" || item.grade === "D"
                    ? "text-warning"
                    : "text-critical"
                }`}
              >
                {item.grade}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{item.criteria}</div>
              <div className="text-xs mt-2">{item.desc}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default GradesPage;
