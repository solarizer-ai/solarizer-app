import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { KeyRound } from "lucide-react";

interface AccessToken {
  id: string;
  code: string;
  description: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface TokenRedemption {
  id: string;
  token_id: string;
  user_id: string;
  redeemed_at: string;
}

export default function AdminAccessTokensPage() {
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedToken, setSelectedToken] = useState<AccessToken | null>(null);

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ["admin-access-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_tokens")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AccessToken[];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["admin-token-redemptions", selectedToken?.id],
    queryFn: async () => {
      if (!selectedToken) return [];
      const { data, error } = await supabase
        .from("access_token_redemptions")
        .select("*")
        .eq("token_id", selectedToken.id)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TokenRedemption[];
    },
    enabled: !!selectedToken,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_create_access_token", {
        p_code: code.toUpperCase().trim(),
        p_description: description || undefined,
        p_max_uses: maxUses ? parseInt(maxUses, 10) : undefined,
        p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Access token created");
      setCode("");
      setDescription("");
      setMaxUses("");
      setExpiresAt("");
      queryClient.invalidateQueries({ queryKey: ["admin-access-tokens"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create token"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase.rpc("admin_toggle_access_token", {
        p_token_id: id,
        p_active: is_active,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-tokens"] }),
    onError: () => toast.error("Failed to update token"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("admin_delete_access_token", {
        p_token_id: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Access token deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-access-tokens"] });
    },
    onError: () => toast.error("Failed to delete token"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-foreground">Access Tokens</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage invite tokens for new subscriptions</p>
        </div>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader><CardTitle>Create New Token</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Code</label>
              <Input
                placeholder="e.g. INVITE2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Internal note"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Max uses (blank = unlimited)</label>
              <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Expires at (blank = never)</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1" />
            </div>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!code || createMutation.isPending}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Token"}
          </Button>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Used / Max</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array(3).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                : tokens.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.code}</TableCell>
                      <TableCell>{t.description || "—"}</TableCell>
                      <TableCell>{t.used_count} / {t.max_uses ?? "∞"}</TableCell>
                      <TableCell>{t.expires_at ? new Date(t.expires_at).toLocaleDateString() : "Never"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={t.is_active}
                          onCheckedChange={(v) => toggleActiveMutation.mutate({ id: t.id, is_active: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedToken(t)}>
                            <Users className="w-4 h-4 mr-1" />
                            Redemptions
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Token</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete token {t.code}?
                                  {t.used_count > 0
                                    ? " This token has redemptions, so it will be deactivated instead."
                                    : " This cannot be undone."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(t.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t.used_count > 0 ? "Deactivate" : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Redemptions Drawer */}
      <Sheet open={!!selectedToken} onOpenChange={(o) => !o && setSelectedToken(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Redemptions — {selectedToken?.code}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No redemptions yet.</p>
            ) : (
              redemptions.map((r) => (
                <div key={r.id} className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-mono break-all">{r.user_id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.redeemed_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
