import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Zap } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function AdminCreditsPage() {
  const queryClient = useQueryClient();
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const debouncedSearch = useDebounce(emailSearch, 400);

  const { data: globalStats } = useQuery({
    queryKey: ["admin-credit-stats"],
    queryFn: async () => {
      const [totalRes, grantedRes, spentRes] = await Promise.all([
        supabase.from("nloc_credits").select("credits_remaining"),
        supabase.from("credit_txns").select("amount").gt("amount", 0),
        supabase.from("credit_txns").select("amount").lt("amount", 0),
      ]);
      const total = (totalRes.data || []).reduce((s: number, r: any) => s + (r.credits_remaining || 0), 0);
      const granted = (grantedRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0);
      const spent = (spentRes.data || []).reduce((s: number, r: any) => s + Math.abs(r.amount || 0), 0);
      return { total, granted, spent };
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin-user-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const { data, error } = await supabase.rpc("admin_get_users", {
        p_limit: 5,
        p_offset: 0,
        p_search: debouncedSearch,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!debouncedSearch,
  });

  const { data: recentAdjustments = [] } = useQuery({
    queryKey: ["admin-adjustments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_txns")
        .select("*, profiles(display_name, email)")
        .eq("type", "admin_adjustment")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      const { error } = await supabase.rpc("admin_adjust_credits", {
        p_target_user_id: selectedUserId,
        p_amount: parseInt(adjustAmount, 10),
        p_reason: adjustReason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Credits adjusted");
      setSelectedUserId(null); setSelectedUserEmail(""); setAdjustAmount(""); setAdjustReason(""); setEmailSearch("");
      queryClient.invalidateQueries({ queryKey: ["admin-credit-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-adjustments"] });
    },
    onError: () => toast.error("Failed to adjust credits"),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide credit management</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Credits in System", value: globalStats?.total.toLocaleString() ?? "—" },
          { label: "Total Granted", value: globalStats?.granted.toLocaleString() ?? "—" },
          { label: "Total Spent", value: globalStats?.spent.toLocaleString() ?? "—" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Adjustment */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Manual Credit Adjustment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search user by email..."
              value={emailSearch}
              onChange={(e) => { setEmailSearch(e.target.value); setSelectedUserId(null); }}
            />
          </div>

          {(searchResults as any[]).length > 0 && !selectedUserId && (
            <div className="border border-border rounded-lg overflow-hidden">
              {(searchResults as any[]).map((u: any) => (
                <button
                  key={u.user_id}
                  className="w-full text-left p-3 text-sm hover:bg-muted/50 border-b border-border/50 last:border-b-0"
                  onClick={() => { setSelectedUserId(u.user_id); setSelectedUserEmail(u.email); setEmailSearch(u.email); }}
                >
                  <span className="text-foreground">{u.email}</span>
                  <span className="text-muted-foreground ml-2">({u.credits_remaining} credits)</span>
                </button>
              ))}
            </div>
          )}

          {selectedUserId && (
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
                className="gap-2"
                onClick={() => adjustMutation.mutate()}
                disabled={!adjustAmount || !adjustReason || adjustMutation.isPending}
              >
                <Zap className="w-4 h-4" />
                {adjustMutation.isPending ? "Applying..." : "Apply"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Adjustments */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Admin Adjustments (last 50)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">User</th>
                  <th className="p-3 text-muted-foreground font-medium">Amount</th>
                  <th className="p-3 text-muted-foreground font-medium">Balance After</th>
                  <th className="p-3 text-muted-foreground font-medium">Description</th>
                  <th className="p-3 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentAdjustments as any[]).map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="p-3 text-muted-foreground">{tx.profiles?.email || tx.user_id}</td>
                    <td className={`p-3 font-medium ${tx.amount >= 0 ? "text-success" : "text-destructive"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount?.toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground">{tx.balance_after?.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{tx.description}</td>
                    <td className="p-3 text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</td>
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
