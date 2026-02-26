import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_OPTIONS = ["all", "analyzing", "secured", "issues", "failed", "cancelled", "pending"];

const statusColor: Record<string, string> = {
  secured: "bg-success/10 text-success border-success/20",
  issues: "bg-warning/10 text-warning border-warning/20",
  analyzing: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending: "bg-muted text-muted-foreground border-border",
};

export default function AdminAuditsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["admin-audits", debouncedSearch, status, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_audits", {
        p_limit: 50,
        p_offset: offset,
        p_status: status === "all" ? null : status,
        p_search: debouncedSearch || null,
      });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audits</h1>
        <p className="text-sm text-muted-foreground mt-1">All audits across all users</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by project or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setOffset(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">User</th>
                  <th className="p-3 text-muted-foreground font-medium">Project</th>
                  <th className="p-3 text-muted-foreground font-medium">Status</th>
                  <th className="p-3 text-muted-foreground font-medium">Grade</th>
                  <th className="p-3 text-muted-foreground font-medium">nLOC</th>
                  <th className="p-3 text-muted-foreground font-medium">Credits</th>
                  <th className="p-3 text-muted-foreground font-medium">Source</th>
                  <th className="p-3 text-muted-foreground font-medium">Phase</th>
                  <th className="p-3 text-muted-foreground font-medium">Created</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array(10).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={10} className="p-3">
                          <div className="h-5 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : (audits as any[]).map((a) => (
                      <tr
                        key={a.audit_id}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/dashboard/admin/audits/${a.audit_id}`)}
                      >
                        <td className="p-3 text-muted-foreground truncate max-w-[120px]">{a.user_email}</td>
                        <td className="p-3 font-medium text-foreground truncate max-w-[120px]">{a.project_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs border ${statusColor[a.status] || ""}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{a.grade || "—"}</td>
                        <td className="p-3 text-muted-foreground">{a.nloc_count?.toLocaleString() || "—"}</td>
                        <td className="p-3 text-muted-foreground">{a.credits_deducted?.toLocaleString() || "—"}</td>
                        <td className="p-3 text-muted-foreground">{a.source || "—"}</td>
                        <td className="p-3 text-muted-foreground">{a.orch_phase || "—"}</td>
                        <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && (audits as any[]).length === 50 && (
            <div className="p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setOffset(offset + 50)}>Load more</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
