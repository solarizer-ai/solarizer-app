import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Tag } from "lucide-react";

interface CouponResult {
  valid: boolean;
  coupon_id?: string;
  code?: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  discount_applied_cents?: number;
  final_amount_cents?: number;
  error?: string;
}

interface CouponInputProps {
  orderType: "subscription" | "power_up";
  amountCents: number;
  onApply: (result: CouponResult | null) => void;
}

export function CouponInput({ orderType, amountCents, onApply }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponResult | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: code.trim().toUpperCase(),
        p_order_type: orderType,
        p_amount_cents: amountCents,
      });
      if (error) throw error;
      const r = data as CouponResult;
      setResult(r);
      onApply(r.valid ? r : null);
    } catch {
      setResult({ valid: false, error: "Failed to validate coupon" });
      onApply(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    onApply(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 font-mono uppercase text-sm"
            placeholder="Coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (result) { setResult(null); onApply(null); }
            }}
            disabled={result?.valid}
          />
        </div>
        {result?.valid ? (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleApply} disabled={!code.trim() || loading}>
            {loading ? "..." : "Apply"}
          </Button>
        )}
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-xs p-2 rounded ${result.valid ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {result.valid
            ? <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            : <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>
            {result.valid
              ? `${result.code}: −${result.discount_type === "percent_off" ? `${result.discount_value}%` : `$${(result.discount_applied_cents! / 100).toFixed(2)}`} applied`
              : result.error}
          </span>
        </div>
      )}
    </div>
  );
}
