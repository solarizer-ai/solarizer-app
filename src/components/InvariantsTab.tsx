import { useState } from "react";
import { Shield, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          {invariants.length} invariant{invariants.length !== 1 ? 's' : ''} identified
        </Badge>
        <span className="text-xs text-muted-foreground">
          ({contractInvariants.length} contract, {crossContractInvariants.length} cross-contract)
        </span>
      </div>

      {/* Contract Invariants */}
      {contractInvariants.length > 0 && (
        <Collapsible open={contractOpen} onOpenChange={setContractOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors w-full text-left">
            {contractOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Contract Invariants ({contractInvariants.length})
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
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors w-full text-left">
            {crossContractOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Cross-Contract Invariants ({crossContractInvariants.length})
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

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground flex-1">{invariant.description}</p>
        <Badge
          className={cn(
            "shrink-0",
            isCritical
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          )}
        >
          {invariant.severity_if_broken}
        </Badge>
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
