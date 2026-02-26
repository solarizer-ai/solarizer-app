import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const statusColor: Record<string, string> = {
  secured: "text-success",
  issues: "text-warning",
  analyzing: "text-primary",
  failed: "text-destructive",
  cancelled: "text-muted-foreground",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: userInfo } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const [profileRes, subRes, creditsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", id!).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", id!).maybeSingle(),
        supabase.from("nloc_credits").select("*").eq("user_id", id!).maybeSingle(),
      ]);
      return {
        profile: profileRes.data,
        subscription: subRes.data,
        credits: creditsRes.data,
      };
    },
    enabled: !!id,
  });

  const { data: audits = [] } = useQuery({
    queryKey: ["admin-user-audits", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_audits", {
        p_limit: 50,
        p_offset: 0,
        p_user_id: id,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: creditHistory = [] } = useQuery({
    queryKey: ["admin-credit-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_txns")
        .select("*")
        .eq("user_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_adjust_credits", {
        p_target_user_id: id!,
        p_amount: parseInt(adjustAmount, 10),
        p_reason: adjustReason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits adjusted");
      setAdjustAmount("");
      setAdjustReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-credit-history", id] });
    },
    onError: () => toast.error("Failed to adjust credits"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/users")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {userInfo?.profile?.display_name || userInfo?.profile?.email || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">{userInfo?.profile?.email}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Plan", value: userInfo?.subscription?.plan || "none" },
          { label: "Status", value: userInfo?.subscription?.status || "—" },
          { label: "Credits", value: userInfo?.credits?.credits_remaining?.toLocaleString() ?? "0" },
          { label: "Member since", value: userInfo?.profile?.created_at ? new Date(userInfo.profile.created_at).toLocaleDateString() : "—" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground mt-1 capitalize">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Credit Adjustment */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Manual Credit Adjustment</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Amount (negative to deduct)"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-48"
            />
            <Input
              placeholder="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => adjustMutation.mutate()}
              disabled={!adjustAmount || !adjustReason || adjustMutation.isPending}
            >
              {adjustMutation.isPending ? "Applying..." : "Apply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audits Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Audits ({(audits as any[]).length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">Project</th>
                  <th className="p-3 text-muted-foreground font-medium">Status</th>
                  <th className="p-3 text-muted-foreground font-medium">Grade</th>
                  <th className="p-3 text-muted-foreground font-medium">nLOC</th>
                  <th className="p-3 text-muted-foreground font-medium">Credits</th>
                  <th className="p-3 text-muted-foreground font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {(audits as any[]).map((a) => (
                  <tr
                    key={a.audit_id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/dashboard/admin/audits/${a.audit_id}`)}
                  >
                    <td className="p-3 font-medium text-foreground">{a.project_name}</td>
                    <td className={`p-3 font-medium ${statusColor[a.status] || ""}`}>{a.status}</td>
                    <td className="p-3 text-muted-foreground">{a.grade || "—"}</td>
                    <td className="p-3 text-muted-foreground">{a.nloc_count?.toLocaleString() || "—"}</td>
                    <td className="p-3 text-muted-foreground">{a.credits_deducted?.toLocaleString() || "—"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Credit History */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Credit History (last 50)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">Type</th>
                  <th className="p-3 text-muted-foreground font-medium">Amount</th>
                  <th className="p-3 text-muted-foreground font-medium">Balance After</th>
                  <th className="p-3 text-muted-foreground font-medium">Description</th>
                  <th className="p-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(creditHistory as any[]).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="p-3 text-foreground capitalize">{tx.type?.replace(/_/g, " ")}</td>
                    <td className={`p-3 font-medium ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount?.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{tx.balance_after?.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{tx.description}</td>
                    <td className="p-3 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
