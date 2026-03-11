import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, X, ArrowLeft } from "lucide-react";
import solarizerLogo from "@/assets/solarizer-logo.png";
import HeroBackground from "@/components/HeroBackground";

export default function ActivateTrial() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
        description: "You now have full Inferno-tier access for 14 days.",
      });

      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["nloc-credits", user?.id] });

      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err: any) {
      setError(err?.message || "Failed to activate trial");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          <img src={solarizerLogo} alt="Solarizer" className="h-10 w-auto" />

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Activate Free Trial
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter your trial access code to unlock full Inferno-tier access for 14 days with 300 credits.
            </p>
          </div>

          <div className="w-full space-y-4 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trial Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 font-mono uppercase text-sm tracking-widest"
                  placeholder="ENTER CODE"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleActivate();
                  }}
                  disabled={loading}
                  maxLength={32}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs p-3 rounded-lg bg-destructive/10 text-destructive">
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

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
