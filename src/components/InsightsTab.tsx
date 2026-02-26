import { useState } from "react";
import { Lightbulb, AlertTriangle, Layers, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ArchitectureInsight } from "@/hooks/useAudits";

interface InsightsTabProps {
  insights: ArchitectureInsight[] | null;
}

const SECTIONS = [
  { category: 'weak_point' as const, label: 'Weak Points', Icon: AlertTriangle },
  { category: 'feature_suggestion' as const, label: 'Feature Suggestions', Icon: Lightbulb },
  { category: 'architecture_improvement' as const, label: 'Architecture Improvements', Icon: Layers },
] as const;

const InsightsTab = ({ insights }: InsightsTabProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    weak_point: true,
    feature_suggestion: true,
    architecture_improvement: true,
  });

  if (!insights || insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Lightbulb className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Insights will appear after analysis completes
        </p>
      </div>
    );
  }

  const toggle = (cat: string) =>
    setOpenSections((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ category, label, Icon }) => {
        const items = insights.filter((i) => i.category === category);
        if (items.length === 0) return null;
        const isOpen = openSections[category] ?? true;

        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggle(category)}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors w-full text-left">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Icon className="w-4 h-4" />
              {label} ({items.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {items.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const InsightCard = ({ insight }: { insight: ArchitectureInsight }) => {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground flex-1">{insight.title}</p>
        <Badge className={cn("shrink-0", priorityStyles[insight.priority] || priorityStyles.low)}>
          {insight.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{insight.description}</p>
      {insight.affected_contracts && insight.affected_contracts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {insight.affected_contracts.map((contract, i) => (
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

export default InsightsTab;
