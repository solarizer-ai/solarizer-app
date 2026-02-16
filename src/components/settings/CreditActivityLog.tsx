import { ArrowDown, Gift, Zap, RotateCcw, Inbox } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreditActivity, CreditTransaction } from "@/hooks/useCreditActivity";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const typeConfig: Record<string, { icon: typeof ArrowDown; color: string; label: string }> = {
  deduction: { icon: ArrowDown, color: "text-destructive", label: "Deduction" },
  grant: { icon: Gift, color: "text-emerald-500", label: "Subscription Grant" },
  purchase: { icon: Zap, color: "text-emerald-500", label: "Credit Purchase" },
  refund: { icon: RotateCcw, color: "text-emerald-500", label: "Refund" },
};

function TransactionRow({ txn }: { txn: CreditTransaction }) {
  const config = typeConfig[txn.type] || typeConfig.deduction;
  const Icon = config.icon;
  const isPositive = txn.amount > 0;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 p-1.5 rounded-md bg-muted/50 ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {txn.description || config.label}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs font-semibold ${isPositive ? "text-emerald-500" : "text-destructive"}`}>
            {isPositive ? "+" : ""}{txn.amount}
          </span>
          {txn.balance_after !== null && (
            <span className="text-xs text-muted-foreground">
              Balance: {txn.balance_after}
            </span>
          )}
          {txn.created_at && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CreditActivityLog() {
  const { data: transactions, isLoading } = useCreditActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Activity</CardTitle>
        <CardDescription>Recent credit movements</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 py-3">
                <Skeleton className="w-8 h-8 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="w-8 h-8 mb-2" />
            <p className="text-sm">No credit activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map(txn => (
              <TransactionRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
