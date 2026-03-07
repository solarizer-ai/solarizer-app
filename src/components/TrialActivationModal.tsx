import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface TrialActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialActivationModal({ open, onOpenChange }: TrialActivationModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleActivate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("activate_trial" as any, {
        p_code: code.trim().toUpperCase(),
      });

      if (rpcError) throw rpcError;

      const result = data as unknown as { success: boolean; error?: string };

      if (!result?.success) {
        setError(result?.error || "Failed to activate trial");
        return;
      }

      toast({
        title: "Trial activated!",
        description: "You now have full Inferno-tier access.",
      });

      // Refresh subscription and credits data
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["nloc-credits", user?.id] });

      onOpenChange(false);
      setCode("");
    } catch (err: any) {
      setError(err?.message || "Failed to activate trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activate Free Trial</DialogTitle>
          <DialogDescription>
            Enter your trial access code to activate full Inferno-tier access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Trial Code</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 font-mono uppercase text-sm"
                  placeholder="Enter trial code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleActivate();
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs p-2 rounded bg-destructive/10 text-destructive">
              <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleActivate}
            disabled={!code.trim() || loading}
          >
            {loading ? "Activating..." : "Activate Trial"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
