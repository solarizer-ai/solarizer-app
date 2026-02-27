import { useState, useEffect } from "react";
import { ArrowLeft, Play, AlertTriangle, Zap, Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

const CONTEXT_CREDIT_RATE = 0.15;

interface FileInput { name: string; content: string; }

interface BatchScopeFile { path: string; nLOC: number; complexity: string; reasoning: string; }
interface BatchContextFile { path: string; nLOC: number; }

interface BatchEstimateResult {
  success: boolean;
  scopeFiles: BatchScopeFile[];
  contextFiles: BatchContextFile[];
  scopeNloc: number;
  contextNloc: number;
  totalCredits: number;
}

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

type EstimationState =
  | { status: 'loading' }
  | { status: 'success'; result: BatchEstimateResult }
  | { status: 'error'; message: string };

const ComplexityBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = {
    L1: 'bg-muted text-muted-foreground',
    L2: 'bg-amber-400 text-black',
    L3: 'bg-orange-500 text-white',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${styles[level] || styles.L1}`}>
      {level}
    </span>
  );
};

function buildLanguageMap(files: Array<{ path: string; nLOC: number }>): Record<string, { files: number; code: number }> {
  const langs: Record<string, { files: number; code: number }> = {};
  for (const f of files) {
    const dotIdx = f.path.lastIndexOf('.');
    const ext = dotIdx >= 0 ? f.path.substring(dotIdx) : f.path;
    if (!langs[ext]) langs[ext] = { files: 0, code: 0 };
    langs[ext].files++;
    langs[ext].code += f.nLOC;
  }
  return langs;
}

const EstimatorStep = ({ scopeFiles, contextFiles, onBack, onProceed, onUpgradeNeeded, onPowerUpNeeded, subscription, credits, isSubmitting = false }: EstimatorStepProps) => {
  const [estimation, setEstimation] = useState<EstimationState>({ status: 'loading' });

  const runEstimation = async () => {
    setEstimation({ status: 'loading' });
    const { data, error } = await invokeWithRefresh<BatchEstimateResult>('web-estimate', {
      body: { scopeFiles, contextFiles },
    });
    if (error || !data || !data.success) {
      setEstimation({ status: 'error', message: error?.message || 'Estimation failed. Please retry.' });
    } else {
      setEstimation({ status: 'success', result: data });
    }
  };

  useEffect(() => { runEstimation(); }, []);

  const plan = subscription?.plan || 'starter';
  const creditsRemaining = credits?.credits_remaining ?? 0;

  if (estimation.status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Credit Estimate</h2>
          <p className="text-sm text-muted-foreground">Analyzing contracts...</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Running complexity analysis...</p>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
          <Button disabled className="gap-2"><Play className="w-4 h-4" />Continue</Button>
        </div>
      </div>
    );
  }

  if (estimation.status === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Credit Estimate</h2>
          <p className="text-sm text-muted-foreground">Could not complete analysis</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 flex flex-col items-center justify-center gap-4">
          <AlertTriangle className="w-8 h-8 text-warning" />
          <p className="text-sm text-muted-foreground text-center">{estimation.message}</p>
          <Button variant="outline" onClick={runEstimation} className="gap-2"><RotateCcw className="w-4 h-4" />Retry</Button>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
          <Button disabled className="gap-2"><Play className="w-4 h-4" />Continue</Button>
        </div>
      </div>
    );
  }

  const { result } = estimation;

  const getValidationStatus = () => {
    const totalNloc = result.scopeNloc + result.contextNloc;
    const planLimit = PLAN_LIMITS[plan]?.nlocPerScan ?? PLAN_LIMITS.starter.nlocPerScan;
    if (totalNloc > planLimit) {
      return { valid: false, reason: 'nloc_limit' as const, message: `Total nLOC (${totalNloc}) exceeds ${planLimit} nLOC limit.` };
    }
    if (result.totalCredits > creditsRemaining) return { valid: false, reason: 'credits' as const, message: `You need ${result.totalCredits} credits but only have ${creditsRemaining}.` };
    return { valid: true, message: `Will use ${result.totalCredits} of your ${creditsRemaining} credits` };
  };

  const validation = getValidationStatus();

  const handleProceed = () => {
    if (!validation.valid) {
      if (validation.reason === 'nloc_limit') onUpgradeNeeded(validation.reason, result.totalCredits);
      else if (validation.reason === 'credits') onPowerUpNeeded(result.totalCredits);
      return;
    }
    const clocResult: CombinedClocResult = {
      scopeNloc: result.scopeNloc,
      contextNloc: result.contextNloc,
      totalCredits: result.totalCredits,
      scopeLanguages: buildLanguageMap(result.scopeFiles),
      contextLanguages: buildLanguageMap(result.contextFiles),
    };
    onProceed(clocResult);
  };

  const RATES: Record<string, number> = { L1: 0.8, L2: 1.0, L3: 1.2 };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Credit Estimate</h2>
        <p className="text-sm text-muted-foreground">Server-calculated breakdown for this analysis</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
        {/* Scope files table */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Scope Files ({result.scopeFiles.length})</h4>
          <div className="space-y-1.5">
            {result.scopeFiles.map((f) => {
              const fileCost = Math.ceil(f.nLOC * (RATES[f.complexity] ?? 1.0));
              const fileName = f.path.split('/').pop() ?? f.path;
              return (
                <div key={f.path} className="flex items-center justify-between p-2 sm:p-2.5 bg-muted/50 rounded-lg text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-foreground truncate">{fileName}</span>
                    <ComplexityBadge level={f.complexity} />
                    {f.reasoning && (
                      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[120px]" title={f.reasoning}>
                        {f.reasoning}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-muted-foreground">{f.nLOC.toLocaleString()} nLOC</span>
                    <span className="text-primary font-medium">{fileCost.toLocaleString()} cr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Context files */}
        {result.contextFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Context Files ({result.contextFiles.length}) — 15% rate</h4>
            <div className="space-y-1.5">
              {result.contextFiles.map((f) => {
                const fileCost = Math.ceil(f.nLOC * CONTEXT_CREDIT_RATE);
                const fileName = f.path.split('/').pop() ?? f.path;
                return (
                  <div key={f.path} className="flex items-center justify-between p-2 sm:p-2.5 bg-muted/30 rounded-lg text-sm gap-2">
                    <span className="text-muted-foreground truncate">{fileName}</span>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-muted-foreground">{f.nLOC.toLocaleString()} nLOC</span>
                      <span className="text-muted-foreground font-medium">{fileCost.toLocaleString()} cr</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-semibold text-foreground">Estimated Credits</span>
          <span className="text-2xl font-bold text-primary">{result.totalCredits.toLocaleString()}</span>
        </div>

        {/* Validation status */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${validation.valid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          {validation.valid ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm">{validation.message}</span>
        </div>
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
