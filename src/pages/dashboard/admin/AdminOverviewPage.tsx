import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Activity, Zap, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

const statusColor: Record<string, string> = {
  secured: "bg-success/10 text-success border-success/20",
  issues: "bg-warning/10 text-warning border-warning/20",
  analyzing: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending: "bg-muted text-muted-foreground border-border",
};

export default function AdminOverviewPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats");
      if (error) throw error;
      return data as {
        total_users: number;
        users_by_plan: Record<string, number>;
        total_audits: number;
        audits_today: number;
        audits_this_week: number;
        audits_by_status: Record<string, number>;
        total_credits_spent: number;
        total_revenue_cents: number;
        active_audits: number;
      };
    },
    refetchInterval: 30000,
  });

  const { data: recentAudits, isLoading: auditsLoading } = useQuery({
    queryKey: ["admin-recent-audits"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_audits", {
        p_limit: 10,
        p_offset: 0,
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const formatRevenue = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const kpiCards = stats
    ? [
        { title: "Total Users", value: stats.total_users.toLocaleString(), icon: Users, color: "text-primary" },
        { title: "Paid Subscribers", value: ((stats.users_by_plan?.pro || 0) + (stats.users_by_plan?.business || 0)).toLocaleString(), icon: CheckCircle, color: "text-success" },
        { title: "Total Audits", value: stats.total_audits.toLocaleString(), icon: Activity, color: "text-foreground" },
        { title: "Active Now", value: stats.active_audits.toLocaleString(), icon: AlertTriangle, color: "text-warning" },
        { title: "Credits Spent", value: stats.total_credits_spent.toLocaleString(), icon: Zap, color: "text-primary" },
        { title: "Revenue", value: formatRevenue(stats.total_revenue_cents), icon: DollarSign, color: "text-success" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsLoading
          ? Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Distribution Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Audits by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.audits_by_status || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-foreground">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(stats.total_audits, 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Users by Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.users_by_plan || {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-foreground">{plan === "none" ? "No plan" : plan}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(stats.total_users, 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Audits */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Audits (last 10)</CardTitle></CardHeader>
        <CardContent>
          {auditsLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 text-muted-foreground font-medium">User</th>
                    <th className="pb-2 text-muted-foreground font-medium">Project</th>
                    <th className="pb-2 text-muted-foreground font-medium">Status</th>
                    <th className="pb-2 text-muted-foreground font-medium">Grade</th>
                    <th className="pb-2 text-muted-foreground font-medium">Credits</th>
                    <th className="pb-2 text-muted-foreground font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentAudits as any[] || []).map((audit) => (
                    <tr
                      key={audit.audit_id}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/dashboard/admin/audits/${audit.audit_id}`)}
                    >
                      <td className="py-2 text-muted-foreground truncate max-w-[140px]">{audit.user_email}</td>
                      <td className="py-2 font-medium text-foreground truncate max-w-[140px]">{audit.project_name}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${statusColor[audit.audit_status] || "bg-muted text-muted-foreground"}`}>
                          {audit.audit_status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{audit.grade || "—"}</td>
                      <td className="py-2 text-muted-foreground">{audit.credits_deducted?.toLocaleString() || "—"}</td>
                      <td className="py-2 text-muted-foreground">{new Date(audit.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
