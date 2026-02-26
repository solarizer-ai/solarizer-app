import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, ChevronRight, Zap } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  plan: string | null;
  subscription_status: string | null;
  credits_remaining: number;
  audits_count: number;
  total_credits_spent: number;
  created_at: string;
  last_audit_at: string | null;
}

const planBadge: Record<string, string> = {
  starter: "bg-muted text-muted-foreground border-transparent",
  pro: "bg-primary/10 text-primary border-primary/20",
  business: "bg-warning/10 text-warning border-warning/20",
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [adjustTarget, setAdjustTarget] = useState<AdminUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_users", {
        p_limit: 50,
        p_offset: offset,
        p_search: debouncedSearch || null,
      });
      if (error) throw error;
      return data as AdminUser[];
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustTarget) return;
      const { error } = await supabase.rpc("admin_adjust_credits", {
        p_target_user_id: adjustTarget.user_id,
        p_amount: parseInt(adjustAmount, 10),
        p_reason: adjustReason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits adjusted successfully");
      setAdjustTarget(null);
      setAdjustAmount("");
      setAdjustReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to adjust credits"),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">All registered users</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">Email</th>
                  <th className="p-3 text-muted-foreground font-medium">Plan</th>
                  <th className="p-3 text-muted-foreground font-medium">Credits</th>
                  <th className="p-3 text-muted-foreground font-medium">Audits</th>
                  <th className="p-3 text-muted-foreground font-medium">Spent</th>
                  <th className="p-3 text-muted-foreground font-medium">Joined</th>
                  <th className="p-3 text-muted-foreground font-medium">Last Audit</th>
                  <th className="p-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array(10).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="p-3">
                          <div className="h-5 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : users.map((u) => (
                      <tr
                        key={u.user_id}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/dashboard/admin/users/${u.user_id}`)}
                      >
                        <td className="p-3 text-foreground">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs border ${planBadge[u.plan || ""] || "bg-muted text-muted-foreground border-transparent"}`}>
                            {u.plan || "none"}
                          </span>
                        </td>
                        <td className="p-3 text-foreground">{u.credits_remaining.toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground">{Number(u.audits_count).toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground">{Number(u.total_credits_spent).toLocaleString()}</td>
                        <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-muted-foreground">{u.last_audit_at ? new Date(u.last_audit_at).toLocaleDateString() : "—"}</td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/admin/users/${u.user_id}`)}>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdjustTarget(u)}>
                              <Zap className="w-3 h-3" />
                              Credits
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!isLoading && users.length === 50 && (
            <div className="p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setOffset(offset + 50)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjust Dialog */}
      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits — {adjustTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-muted-foreground">Amount (use negative to deduct)</label>
              <Input
                type="number"
                placeholder="e.g. 500 or -100"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Reason</label>
              <Input
                placeholder="e.g. Compensation for failed audit"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button
              onClick={() => adjustMutation.mutate()}
              disabled={!adjustAmount || !adjustReason || adjustMutation.isPending}
            >
              {adjustMutation.isPending ? "Applying..." : "Apply Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
