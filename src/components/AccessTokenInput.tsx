import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, KeyRound } from "lucide-react";

interface AccessTokenResult {
  valid: boolean;
  token_id?: string;
  code?: string;
  error?: string;
}

interface AccessTokenInputProps {
  onValidate: (result: AccessTokenResult | null) => void;
}

export function AccessTokenInput({ onValidate }: AccessTokenInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AccessTokenResult | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_access_token", {
        p_code: code.trim().toUpperCase(),
      });
      if (error) throw error;
      const r = data as unknown as AccessTokenResult;
      const enriched = { ...r, code: code.trim().toUpperCase() };
      setResult(enriched);
      onValidate(enriched.valid ? enriched : null);
    } catch {
      const fail = { valid: false, error: "Failed to validate access token" };
      setResult(fail);
      onValidate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    onValidate(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Access Token</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 font-mono uppercase text-sm"
            placeholder="Enter invite code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (result) { setResult(null); onValidate(null); }
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !result?.valid) handleValidate(); }}
            disabled={result?.valid}
          />
        </div>
        {result?.valid ? (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleValidate} disabled={!code.trim() || loading}>
            {loading ? "..." : "Verify"}
          </Button>
        )}
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-xs p-2 rounded ${result.valid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {result.valid
            ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            : <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{result.valid ? "Access token verified" : result.error}</span>
        </div>
      )}
    </div>
  );
}
