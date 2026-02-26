import { useMemo } from "react";
import { ArrowLeft, Play, AlertTriangle, Zap, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateNLOC, PLAN_LIMITS } from "@/lib/nlocCalculator";

const CONTEXT_CREDIT_RATE = 0.15;

interface FileInput { name: string; content: string; }

interface CombinedClocResult {
  scopeNloc: number; contextNloc: number; totalCredits: number;
  scopeLanguages: Record<string, { files: number; code: number }>;
  contextLanguages: Record<string, { files: number; code: number }>;
}

interface EstimatorStepProps {
  scopeFiles: FileInput[]; contextFiles: FileInput[];
  onBack: () => void; onProceed: (clocResult: CombinedClocResult) => void;
  onUpgradeNeeded: (reason: 'nloc_limit' | 'file_limit', nloc: number) => void;
  onPowerUpNeeded: (nloc: number) => void;
  subscription: { plan: 'starter' | 'pro' | 'business' } | null | undefined;
  credits: { credits_remaining: number; scans_remaining: number } | null | undefined;
  isSubmitting?: boolean;
}

const EstimatorStep = ({ scopeFiles, contextFiles, onBack, onProceed, onUpgradeNeeded, onPowerUpNeeded, subscription, credits, isSubmitting = false }: EstimatorStepProps) => {
  const combinedResult = useMemo<CombinedClocResult>(() => {
    const scopeNloc = scopeFiles.reduce((sum, f) => sum + calculateNLOC(f.content), 0);
    const contextNloc = contextFiles.reduce((sum, f) => sum + calculateNLOC(f.content), 0);
    const totalCredits = scopeNloc + Math.floor(contextNloc * CONTEXT_CREDIT_RATE);

    const groupByExt = (files: FileInput[]) => {
      const langs: Record<string, { files: number; code: number }> = {};
      for (const f of files) { const ext = f.name.substring(f.name.lastIndexOf('.')); const nloc = calculateNLOC(f.content); if (!langs[ext]) langs[ext] = { files: 0, code: 0 }; langs[ext].files++; langs[ext].code += nloc; }
      return langs;
    };

    return { scopeNloc, contextNloc, totalCredits, scopeLanguages: groupByExt(scopeFiles), contextLanguages: groupByExt(contextFiles) };
  }, [scopeFiles, contextFiles]);

  const plan = subscription?.plan || 'starter';
  const creditsRemaining = credits?.credits_remaining ?? 0;

  const getValidationStatus = () => {
    if (plan === 'starter') {
      if (scopeFiles.length > (PLAN_LIMITS.starter as any).maxFilesPerScan) return { valid: false, reason: 'file_limit' as const, message: `Launch plan allows only 1 file per scan.` };
      if (combinedResult.scopeNloc > PLAN_LIMITS.starter.nlocPerScan) return { valid: false, reason: 'nloc_limit' as const, message: `Scope (~${combinedResult.scopeNloc} nLOC) exceeds ${PLAN_LIMITS.starter.nlocPerScan} nLOC limit.` };
      if (combinedResult.totalCredits > creditsRemaining) return { valid: false, reason: 'credits' as const, message: `You need ~${combinedResult.totalCredits} credits but only have ${creditsRemaining}.` };
      return { valid: true, message: 'Within your plan limits' };
    }
    if (combinedResult.totalCredits > creditsRemaining) return { valid: false, reason: 'credits' as const, message: `You need ~${combinedResult.totalCredits} credits but only have ${creditsRemaining}.` };
    return { valid: true, message: `Will use ~${combinedResult.totalCredits} of your ${creditsRemaining} credits` };
  };

  const validation = getValidationStatus();

  const handleProceed = () => {
    if (!validation.valid) {
      if (validation.reason === 'nloc_limit' || validation.reason === 'file_limit') onUpgradeNeeded(validation.reason, combinedResult.totalCredits);
      else if (validation.reason === 'credits') onPowerUpNeeded(combinedResult.totalCredits);
      return;
    }
    onProceed(combinedResult);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Credit Estimate</h2>
        <p className="text-sm text-muted-foreground">Preview of estimated credits needed for this analysis</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 shrink-0" /><span>This is a client-side estimate. The server recalculates exact credits on submission.</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div><span className="text-sm font-medium text-foreground">Scope Files</span><span className="text-xs text-muted-foreground ml-2">({scopeFiles.length} files)</span></div>
            <div className="text-right"><span className="text-lg font-bold text-foreground">~{combinedResult.scopeNloc.toLocaleString()}</span><span className="text-xs text-muted-foreground ml-1">nLOC</span><span className="text-xs text-primary ml-2">(100%)</span></div>
          </div>
          {contextFiles.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div><span className="text-sm font-medium text-muted-foreground">Context Files</span><span className="text-xs text-muted-foreground ml-2">({contextFiles.length} files)</span></div>
              <div className="text-right"><span className="text-lg font-semibold text-muted-foreground">~{combinedResult.contextNloc.toLocaleString()}</span><span className="text-xs text-muted-foreground ml-1">nLOC</span><span className="text-xs text-muted-foreground ml-2">→ ~{Math.floor(combinedResult.contextNloc * CONTEXT_CREDIT_RATE).toLocaleString()} credits (15%)</span></div>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-semibold text-foreground">Estimated Credits</span>
            <span className="text-2xl font-bold text-primary">~{combinedResult.totalCredits.toLocaleString()}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 p-3 rounded-lg ${validation.valid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          {validation.valid ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm">{validation.message}</span>
        </div>
        {Object.keys(combinedResult.scopeLanguages).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Scope Breakdown</h4>
            <div className="space-y-1">{Object.entries(combinedResult.scopeLanguages).map(([lang, stats]) => (
              <div key={lang} className="flex items-center justify-between text-sm py-1"><span className="text-foreground">{lang}</span><span className="text-muted-foreground">~{stats.code.toLocaleString()} nLOC ({stats.files} {stats.files === 1 ? 'file' : 'files'})</span></div>
            ))}</div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <Button onClick={handleProceed} disabled={isSubmitting} className="gap-2">
          {!validation.valid ? <Zap className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {!validation.valid ? (validation.reason === 'credits' ? 'Get Power-Up' : 'Upgrade Plan') : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default EstimatorStep;
