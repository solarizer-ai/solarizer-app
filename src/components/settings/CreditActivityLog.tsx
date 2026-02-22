import { useState } from "react";
import { Gift, Zap, RotateCcw, Inbox, ChevronLeft, ChevronRight, X, ArrowDown, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCreditActivity, CreditTransaction } from "@/hooks/useCreditActivity";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: typeof ArrowDown; color: string; label: string; badgeVariant: "destructive" | "default" | "secondary" | "outline" }> = {
  deduction: { icon: ArrowDown, color: "text-destructive", label: "Deduction", badgeVariant: "destructive" },
  grant: { icon: Gift, color: "text-success", label: "Grant", badgeVariant: "default" },
  purchase: { icon: Zap, color: "text-success", label: "Purchase", badgeVariant: "default" },
  refund: { icon: RotateCcw, color: "text-success", label: "Refund", badgeVariant: "default" },
};

export function CreditActivityLog() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const startDateStr = startDate ? format(startDate, "yyyy-MM-dd") : null;
  const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : null;

  const { data: result, isLoading } = useCreditActivity({ startDate: startDateStr, endDate: endDateStr, page, pageSize });
  const transactions = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const hasFilters = startDate || endDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Activity</CardTitle>
        <CardDescription>Recent credit movements</CardDescription>
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 w-[160px] justify-start text-left text-xs font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd-MM-yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setPage(1); }} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 w-[160px] justify-start text-left text-xs font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd-MM-yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setPage(1); }} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs gap-1">
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
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
        ) : !transactions.length ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="w-8 h-8 mb-2" />
            <p className="text-sm">No credit activity yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Time</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Description</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => {
                  const config = typeConfig[txn.type] || typeConfig.deduction;
                  const isPositive = txn.amount > 0;
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {txn.created_at ? format(new Date(txn.created_at), "dd-MM-yyyy HH:mm:ss") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.badgeVariant} className="text-[10px] font-medium">
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-[280px] truncate">
                        {txn.description
                          ? txn.description.replace(/^(?:CLI Audit|Audit):\s*/i, "").replace(/\s*\(.*\)\s*$/, "")
                          : config.label}
                      </TableCell>
                      <TableCell className={cn("text-xs font-semibold text-right whitespace-nowrap", isPositive ? "text-success" : "text-destructive")}>
                        {isPositive ? "+" : ""}{txn.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-foreground text-right whitespace-nowrap">
                        {txn.balance_after !== null ? txn.balance_after.toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Lines Per Page</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
