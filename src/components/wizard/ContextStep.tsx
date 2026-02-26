import { ArrowLeft, Play, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ContextStepProps {
  additionalContext: string;
  onContextChange: (context: string) => void;
  onBack: () => void;
  onProceed: () => void;
  isSubmitting: boolean;
  nloc: number;
}

const ContextStep = ({ additionalContext, onContextChange, onBack, onProceed, isSubmitting, nloc }: ContextStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Additional Context</h2>
        <p className="text-sm text-muted-foreground">Provide any additional context for the security analysis (optional but recommended)</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <Textarea placeholder="Describe specific areas of concern, known issues, intended functionality, protocol integrations..." value={additionalContext} onChange={(e) => onContextChange(e.target.value)} rows={8} maxLength={5000} className="resize-none text-base" />
        <p className="text-xs text-muted-foreground text-right">{additionalContext.length.toLocaleString()}/5,000 characters</p>
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Examples:</span> Focus areas, external dependencies, expected behaviors, known limitations, protocol integrations, or specific functions to prioritize.</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <Button onClick={onProceed} disabled={isSubmitting} className="gap-2">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}Start Analysis</Button>
      </div>
    </div>
  );
};

export default ContextStep;
