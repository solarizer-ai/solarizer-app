import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const GradesPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Security Grades</h2>
      <p className="text-sm text-muted-foreground mt-1">Understanding your security score</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Grade Breakdown
        </CardTitle>
        <CardDescription>How your security score maps to a grade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { grade: "A", range: "85-100%", desc: "Excellent security posture" },
            { grade: "B", range: "70-84%", desc: "Good with minor issues" },
            { grade: "C", range: "60-69%", desc: "Moderate vulnerabilities" },
            { grade: "D", range: "50-59%", desc: "Significant concerns" },
            { grade: "F", range: "0-49%", desc: "Critical issues found" },
          ].map((item) => (
            <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
              <div
                className={`text-2xl font-bold ${
                  item.grade === "A" || item.grade === "B"
                    ? "text-success"
                    : item.grade === "C"
                    ? "text-warning"
                    : "text-destructive"
                }`}
              >
                {item.grade}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{item.range}</div>
              <div className="text-xs mt-2">{item.desc}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default GradesPage;
