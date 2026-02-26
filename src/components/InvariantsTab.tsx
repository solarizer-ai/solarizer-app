import { useState } from "react";
import { Shield, ChevronDown, ChevronRight, FileCode, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { Invariant } from "@/hooks/useAudits";

interface InvariantsTabProps {
  invariants: Invariant[] | null;
}

const InvariantsTab = ({ invariants }: InvariantsTabProps) => {
  const [contractOpen, setContractOpen] = useState(true);
  const [crossContractOpen, setCrossContractOpen] = useState(true);

  if (!invariants || invariants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Shield className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Invariants will appear after analysis completes
        </p>
      </div>
    );
  }

  const contractInvariants = invariants.filter(i => i.scope === 'contract');
  const crossContractInvariants = invariants.filter(i => i.scope === 'cross-contract');
  const criticalCount = invariants.filter(i => i.severity_if_broken === 'CRITICAL').length;
  const highCount = invariants.filter(i => i.severity_if_broken === 'HIGH').length;
  const criticalPct = invariants.length > 0 ? Math.round((criticalCount / invariants.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-4 md:p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{invariants.length}</p>
            <p className="text-sm text-muted-foreground">Invariant{invariants.length !== 1 ? 's' : ''} identified</p>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Severity distribution</span>
            <span>{criticalPct}% critical</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
            {criticalCount > 0 && (
              <div
                className="bg-destructive transition-all"
                style={{ width: `${criticalPct}%` }}
              />
            )}
            {highCount > 0 && (
              <div
                className="bg-orange-500 transition-all"
                style={{ width: `${100 - criticalPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive">
            {criticalCount} critical
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
            {highCount} high
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileCode className="w-3 h-3" />
            {contractInvariants.length} contract
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <GitBranch className="w-3 h-3" />
            {crossContractInvariants.length} cross-contract
          </span>
        </div>
      </div>

      {/* Contract Invariants */}
      {contractInvariants.length > 0 && (
        <Collapsible open={contractOpen} onOpenChange={setContractOpen}>
          <CollapsibleTrigger className="flex items-center gap-3 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors w-full text-left pl-3 border-l-2 border-l-blue-500">
            {contractOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            Contract Invariants ({contractInvariants.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3 ml-3">
            {contractInvariants.map((inv, i) => (
              <InvariantCard key={i} invariant={inv} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Cross-Contract Invariants */}
      {crossContractInvariants.length > 0 && (
        <Collapsible open={crossContractOpen} onOpenChange={setCrossContractOpen}>
          <CollapsibleTrigger className="flex items-center gap-3 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors w-full text-left pl-3 border-l-2 border-l-amber-500">
            {crossContractOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <GitBranch className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            Cross-Contract Invariants ({crossContractInvariants.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3 ml-3">
            {crossContractInvariants.map((inv, i) => (
              <InvariantCard key={i} invariant={inv} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

const InvariantCard = ({ invariant }: { invariant: Invariant }) => {
  const isCritical = invariant.severity_if_broken === 'CRITICAL';
  const isContract = invariant.scope === 'contract';

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 space-y-3 border-l-4",
      isCritical ? "border-l-destructive" : "border-l-orange-500"
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground flex-1 leading-relaxed">{invariant.description}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              isContract
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            )}
          >
            {invariant.scope}
          </Badge>
          <Badge
            className={cn(
              isCritical
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
            )}
          >
            {invariant.severity_if_broken}
          </Badge>
        </div>
      </div>
      {invariant.contracts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {invariant.contracts.map((contract, i) => (
            <span
              key={i}
              className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
            >
              {contract}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvariantsTab;
