import { useState } from "react";
import { Shield, ChevronDown, ChevronRight, FileCode, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TerminalPanel } from "@/components/ui/TerminalPanel";
import { TerminalDivider } from "@/components/ui/TerminalDivider";
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
      {/* Top Divider */}
      <TerminalDivider
        label="Protocol Invariants"
        right={
          <span className="text-muted-foreground/60 font-mono text-[11px]">
            {invariants.length} invariant{invariants.length !== 1 ? 's' : ''}
          </span>
        }
      />

      {/* Summary Card */}
      <TerminalPanel variant="data">
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
                className="bg-critical transition-all"
                style={{ width: `${criticalPct}%` }}
              />
            )}
            {highCount > 0 && (
              <div
                className="bg-destructive transition-all"
                style={{ width: `${100 - criticalPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-critical/10 text-critical">
            {criticalCount} critical
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive">
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
      </TerminalPanel>

      {/* Contract Invariants */}
      {contractInvariants.length > 0 && (
        <Collapsible open={contractOpen} onOpenChange={setContractOpen}>
          <CollapsibleTrigger className="w-full text-left">
            <TerminalDivider
              label={`Contract Invariants (${contractInvariants.length})`}
              right={
                contractOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              }
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {contractInvariants.map((inv, i) => (
              <InvariantCard key={i} invariant={inv} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Cross-Contract Invariants */}
      {crossContractInvariants.length > 0 && (
        <Collapsible open={crossContractOpen} onOpenChange={setCrossContractOpen}>
          <CollapsibleTrigger className="w-full text-left">
            <TerminalDivider
              label={`Cross-Contract Invariants (${crossContractInvariants.length})`}
              right={
                crossContractOpen
                  ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                  : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              }
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
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
      "rounded-lg ring-1 ring-white/[0.05] bg-[#050505] p-4 space-y-3 border-l-4",
      isCritical ? "border-l-destructive" : "border-l-orange-500"
    )}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground flex-1 leading-relaxed">{invariant.description}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            className={cn(
              "font-mono text-[12px] px-1.5 py-0",
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
                ? "bg-critical/10 text-critical border-critical/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
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
              className="font-mono text-[12px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground"
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
