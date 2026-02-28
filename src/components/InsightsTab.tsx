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
  {
    category: 'weak_point' as const,
    label: 'Weak Points',
    Icon: AlertTriangle,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    borderColor: 'border-l-destructive',
    pillBg: 'bg-destructive/10 text-destructive',
  },
  {
    category: 'feature_suggestion' as const,
    label: 'Feature Suggestions',
    Icon: Lightbulb,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-l-amber-500',
    pillBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    category: 'architecture_improvement' as const,
    label: 'Architecture Improvements',
    Icon: Layers,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    pillBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
] as const;

const priorityBorder: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

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

  const counts = SECTIONS.map((s) => ({
    ...s,
    count: insights.filter((i) => i.category === s.category).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-4 md:p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{insights.length}</p>
            <p className="text-sm text-muted-foreground">Insight{insights.length !== 1 ? 's' : ''} identified</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map(({ label, Icon, count, pillBg }) =>
            count > 0 ? (
              <span key={label} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", pillBg)}>
                <Icon className="w-3 h-3" />
                {count} {label}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ category, label, Icon, iconBg, iconColor, borderColor }) => {
        const items = insights.filter((i) => i.category === category);
        if (items.length === 0) return null;
        const isOpen = openSections[category] ?? true;

        return (
          <Collapsible key={category} open={isOpen} onOpenChange={() => toggle(category)}>
            <CollapsibleTrigger className={cn(
              "flex items-center gap-3 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors w-full text-left pl-3 border-l-2",
              borderColor
            )}>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", iconBg)}>
                <Icon className={cn("w-3.5 h-3.5", iconColor)} />
              </div>
              {label} ({items.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3 ml-3">
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

const InsightCard = ({ insight }: { insight: ArchitectureInsight }) => {
  const section = SECTIONS.find((s) => s.category === insight.category);

  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 space-y-3 border-l-4",
      priorityBorder[insight.priority] || priorityBorder.low
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {section && (
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", section.iconBg)}>
              <section.Icon className={cn("w-3 h-3", section.iconColor)} />
            </div>
          )}
          <p className="text-sm font-bold text-foreground leading-snug">{insight.title}</p>
        </div>
        <Badge className={cn("shrink-0", priorityStyles[insight.priority] || priorityStyles.low)}>
          {insight.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
      {insight.affected_contracts && insight.affected_contracts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {insight.affected_contracts.map((contract, i) => (
            <span
              key={i}
              className={cn(
                "font-mono text-xs rounded px-1.5 py-0.5",
                section ? section.pillBg : "bg-muted text-muted-foreground"
              )}
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
