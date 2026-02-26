import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent_off" | "amount_off_cents";
  discount_value: number;
  applicable_to: string[];
  max_uses: number | null;
  used_count: number;
  min_amount_cents: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  original_amount_cents: number;
  discounted_amount_cents: number;
  discount_applied_cents: number;
  redeemed_at: string;
  profiles: { display_name: string | null } | null;
}

export default function AdminCouponsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent_off" | "amount_off_cents">("percent_off");
  const [discountValue, setDiscountValue] = useState("");
  const [applyTo, setApplyTo] = useState<string[]>(["subscription", "power_up"]);
  const [maxUses, setMaxUses] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["admin-redemptions", selectedCoupon?.id],
    queryFn: async () => {
      if (!selectedCoupon) return [];
      const { data, error } = await supabase
        .from("coupon_redemptions")
        .select("*")
        .eq("coupon_id", selectedCoupon.id)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, profiles: null })) as Redemption[];
    },
    enabled: !!selectedCoupon,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: code.toUpperCase().trim(),
        description: description || null,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        applicable_to: applyTo,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        min_amount_cents: minAmount ? Math.round(parseFloat(minAmount) * 100) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Coupon created");
      setCode(""); setDescription(""); setDiscountValue(""); setMaxUses(""); setMinAmount(""); setExpiresAt("");
      setDiscountType("percent_off"); setApplyTo(["subscription", "power_up"]);
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create coupon"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: () => toast.error("Failed to update coupon"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: () => toast.error("Failed to delete coupon"),
  });

  const formatDiscount = (c: Coupon) =>
    c.discount_type === "percent_off"
      ? `${c.discount_value}% off`
      : `$${(c.discount_value / 100).toFixed(2)} off`;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage discount coupons</p>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Create New Coupon</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Code</label>
              <Input
                placeholder="SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Description (optional)</label>
              <Input
                placeholder="20% off any plan"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Discount Type</label>
              <div className="flex gap-4 mt-2">
                {(["percent_off", "amount_off_cents"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={discountType === t}
                      onChange={() => setDiscountType(t)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {t === "percent_off" ? "% off" : "$ off"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {discountType === "percent_off" ? "Percent (e.g. 20 = 20%)" : "Amount in $ (e.g. 10 = $10 off)"}
              </label>
              <Input
                type="number"
                placeholder={discountType === "percent_off" ? "20" : "10"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Applies to</label>
            <div className="flex gap-4 mt-2">
              {["subscription", "power_up"].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={applyTo.includes(t)}
                    onCheckedChange={(checked) =>
                      setApplyTo(checked ? [...applyTo, t] : applyTo.filter((x) => x !== t))
                    }
                  />
                  <span className="text-sm text-foreground capitalize">{t.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Max uses (blank = unlimited)</label>
              <Input type="number" placeholder="100" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min order $ (blank = none)</label>
              <Input type="number" placeholder="50" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Expires at (blank = never)</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1" />
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!code || !discountValue || applyTo.length === 0 || createMutation.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Coupon"}
          </Button>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-3 text-muted-foreground font-medium">Code</th>
                  <th className="p-3 text-muted-foreground font-medium">Discount</th>
                  <th className="p-3 text-muted-foreground font-medium">Applies to</th>
                  <th className="p-3 text-muted-foreground font-medium">Used / Max</th>
                  <th className="p-3 text-muted-foreground font-medium">Expires</th>
                  <th className="p-3 text-muted-foreground font-medium">Active</th>
                  <th className="p-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array(3).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="p-3">
                          <div className="h-5 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : coupons.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-mono font-medium text-foreground">{c.code}</td>
                        <td className="p-3 text-foreground">{formatDiscount(c)}</td>
                        <td className="p-3 text-muted-foreground">{c.applicable_to.join(", ")}</td>
                        <td className="p-3 text-muted-foreground">{c.used_count} / {c.max_uses ?? "∞"}</td>
                        <td className="p-3 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                        <td className="p-3">
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={(v) => toggleActiveMutation.mutate({ id: c.id, is_active: v })}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="gap-1" onClick={() => setSelectedCoupon(c)}>
                              <Users className="w-3.5 h-3.5" />
                              Redemptions
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(c.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Redemptions Drawer */}
      <Sheet open={!!selectedCoupon} onOpenChange={(o) => !o && setSelectedCoupon(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Redemptions — {selectedCoupon?.code}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 overflow-y-auto max-h-[80vh]">
            {redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No redemptions yet.</p>
            ) : (
              redemptions.map((r) => (
                <div key={r.id} className="p-3 border border-border rounded-lg space-y-1">
                  <p className="text-sm font-medium text-foreground">{r.profiles?.display_name || r.user_id}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Original: ${(r.original_amount_cents / 100).toFixed(2)}</span>
                    <span>Discount: −${(r.discount_applied_cents / 100).toFixed(2)}</span>
                    <span>Final: ${(r.discounted_amount_cents / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(r.redeemed_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
