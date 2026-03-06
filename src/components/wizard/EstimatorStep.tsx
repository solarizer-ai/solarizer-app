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
    L1: 'bg-muted text-muted-foreground ring-1 ring-border',
    L2: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30',
    L3: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[level] || styles.L1}`}>
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

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">File</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Complexity</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">nLOC</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
            </tr>
          </thead>
          <tbody>
            {/* Scope files section label */}
            <tr className="border-b border-border/50">
              <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                Scope Files ({result.scopeFiles.length})
              </td>
            </tr>

            {/* Scope file rows */}
            {result.scopeFiles.map((f) => {
              const fileCost = Math.ceil(f.nLOC * (RATES[f.complexity] ?? 1.0));
              const fileName = f.path.split('/').pop() ?? f.path;
              return (
                <tr key={f.path} className="border-b border-border/30 hover:bg-muted/30 transition-colors" title={f.reasoning || undefined}>
                  <td className="px-4 py-2 text-foreground truncate max-w-[200px]">{fileName}</td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    <ComplexityBadge level={f.complexity} />
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">{f.nLOC.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-foreground font-medium tabular-nums">{fileCost.toLocaleString()}</td>
                </tr>
              );
            })}

            {/* Context files section label + rows */}
            {result.contextFiles.length > 0 && (
              <>
                <tr className="border-b border-border/50">
                  <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    Context Files ({result.contextFiles.length})
                    <span className="ml-2 text-[10px] font-normal normal-case">— 15% rate</span>
                  </td>
                </tr>
                {result.contextFiles.map((f) => {
                  const fileCost = Math.ceil(f.nLOC * CONTEXT_CREDIT_RATE);
                  const fileName = f.path.split('/').pop() ?? f.path;
                  return (
                    <tr key={f.path} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{fileName}</td>
                      <td className="px-4 py-2 hidden sm:table-cell">
                        <span className="text-muted-foreground/50">—</span>
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">{f.nLOC.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-foreground font-medium tabular-nums">{fileCost.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-foreground">Estimated Credits</td>
              <td className="px-4 py-3 text-right text-2xl font-bold text-primary tabular-nums">{result.totalCredits.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Validation banner */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border-l-4 ${
        validation.valid
          ? 'border-l-green-500 bg-green-500/5 text-green-500'
          : 'border-l-amber-500 bg-amber-500/5 text-amber-500'
      }`}>
        {validation.valid ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
        <span className="text-sm">{validation.message}</span>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <Button onClick={handleProceed} disabled={isSubmitting} className="gap-2">
          {!validation.valid ? <Zap className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {!validation.valid ? (validation.reason === 'credits' ? 'Buy Credits' : 'Upgrade Plan') : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default EstimatorStep;
