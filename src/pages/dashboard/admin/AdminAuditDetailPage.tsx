import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

const GCP_PROJECT = "gen-lang-client-0197089816";

function buildCloudRunLogsUrl(auditId: string): string {
  const query = encodeURIComponent(
    `resource.type="cloud_run_job" resource.labels.job_name="solarizer-audit-job" "${auditId}"`
  );
  return `https://console.cloud.google.com/logs/query;query=${query};project=${GCP_PROJECT}`;
}

const severityColors: Record<string, string> = {
  critical: "bg-critical/10 text-critical border-critical/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-low/10 text-low border-low/20",
  info: "bg-slate-400/10 text-slate-400 border-slate-400/20",
  gas: "bg-green-500/10 text-green-500 border-green-500/20",
};

export default function AdminAuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audits")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: orchestration } = useQuery({
    queryKey: ["admin-orch", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_orchestration")
        .select("*")
        .eq("session_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: findingCounts } = useQuery({
    queryKey: ["admin-findings-count", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("findings")
        .select("severity")
        .eq("audit_id", id!);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((f: any) => {
        counts[f.severity] = (counts[f.severity] || 0) + 1;
      });
      return counts;
    },
    enabled: !!id,
  });

  if (auditLoading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-4" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">Audit not found</p>
            <p className="text-sm text-muted-foreground mb-4">The audit you're looking for doesn't exist or has been removed.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/admin/audits")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Audits
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = orchestration?.progress as Record<string, any> | null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/audits")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{audit?.project_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
      </div>

      {/* Audit Info */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Audit Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Status", value: audit?.status },
              { label: "Grade", value: audit?.grade || "—" },
              { label: "Source", value: audit?.source || "—" },
              { label: "nLOC", value: audit?.nloc_count?.toLocaleString() || "—" },
              { label: "Credits Deducted", value: audit?.credits_deducted?.toLocaleString() || "—" },
              { label: "Findings", value: (findingCounts ? Object.values(findingCounts).reduce((s: number, c: number) => s + c, 0) : 0).toLocaleString() },
              { label: "Created", value: audit?.created_at ? new Date(audit.created_at).toLocaleString() : "—" },
              { label: "Error", value: audit?.error_message || "none" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 break-all">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orchestration / Troubleshooting */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Orchestration / Troubleshooting</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(buildCloudRunLogsUrl(id!), "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Cloud Run Logs
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {orchestration ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Phase</p>
                  <p className="text-sm font-medium text-foreground capitalize">{orchestration.phase || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium text-foreground capitalize">{orchestration.status || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {orchestration.updated_at ? new Date(orchestration.updated_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              {orchestration.error && (
                <div className="p-3 bg-destructive/10 rounded border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Error</p>
                  <pre className="text-xs text-destructive font-mono whitespace-pre-wrap break-all">
                    {orchestration.error}
                  </pre>
                </div>
              )}

              {progress && (
                <details>
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                    Progress JSON ▶
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify(progress, null, 2)}
                  </pre>
                </details>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No orchestration record found.</p>
          )}
        </CardContent>
      </Card>

      {/* Findings Summary */}
      {findingCounts && Object.keys(findingCounts).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Findings Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["critical", "high", "medium", "low", "info", "gas"].map((sev) =>
                (findingCounts[sev] || 0) > 0 ? (
                  <span
                    key={sev}
                    className={`px-3 py-1 rounded-full text-xs border font-medium ${severityColors[sev]}`}
                  >
                    {findingCounts[sev]} {sev}
                  </span>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
