import { useEffect, useState } from "react";
import { ArrowLeft, Play, Loader2, Check, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClocEstimate, FileInput, ClocResult } from "@/hooks/useClocEstimate";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";

const CONTEXT_CREDIT_RATE = 0.35; // 35% credits for context files

interface CombinedClocResult {
  scopeNloc: number;
  contextNloc: number;
  totalCredits: number;
  scopeLanguages: ClocResult['languages'];
  contextLanguages: ClocResult['languages'];
}

interface EstimatorStepProps {
  scopeFiles: FileInput[];
  contextFiles: FileInput[];
  onBack: () => void;
  onProceed: (clocResult: CombinedClocResult) => void;
  onUpgradeNeeded: (reason: 'nloc_limit' | 'file_limit', nloc: number) => void;
  onPowerUpNeeded: (nloc: number) => void;
  subscription: { plan: 'starter' | 'pro' | 'business' } | null | undefined;
  credits: { credits_remaining: number; scans_remaining: number } | null | undefined;
  isSubmitting?: boolean;
}

const EstimatorStep = ({
  scopeFiles,
  contextFiles,
  onBack,
  onProceed,
  onUpgradeNeeded,
  onPowerUpNeeded,
  subscription,
  credits,
  isSubmitting = false,
}: EstimatorStepProps) => {
  const scopeEstimate = useClocEstimate();
  const contextEstimate = useClocEstimate();
  
  const [combinedResult, setCombinedResult] = useState<CombinedClocResult | null>(null);

  // Auto-trigger estimation when component mounts
  useEffect(() => {
    if (scopeFiles.length > 0 && !scopeEstimate.data && !scopeEstimate.isPending && !scopeEstimate.isError) {
      scopeEstimate.mutate(scopeFiles);
    }
  }, [scopeFiles]);

  // Trigger context estimation after scope is done (only if there are context files)
  useEffect(() => {
    if (scopeEstimate.data && contextFiles.length > 0 && !contextEstimate.data && !contextEstimate.isPending && !contextEstimate.isError) {
      contextEstimate.mutate(contextFiles);
    }
  }, [scopeEstimate.data, contextFiles]);

  // Combine results when both are ready
  useEffect(() => {
    if (scopeEstimate.data) {
      const scopeNloc = scopeEstimate.data.totalNloc;
      const contextNloc = contextEstimate.data?.totalNloc || 0;
      const contextCredits = Math.floor(contextNloc * CONTEXT_CREDIT_RATE);
      const totalCredits = scopeNloc + contextCredits;

      setCombinedResult({
        scopeNloc,
        contextNloc,
        totalCredits,
        scopeLanguages: scopeEstimate.data.languages,
        contextLanguages: contextEstimate.data?.languages || {},
      });
    }
  }, [scopeEstimate.data, contextEstimate.data]);

  const plan = subscription?.plan || 'starter';
  const creditsRemaining = credits?.credits_remaining ?? 0;
  const fileCount = scopeFiles.length;

  const isPending = scopeEstimate.isPending || (contextFiles.length > 0 && contextEstimate.isPending);
  const isError = scopeEstimate.isError || contextEstimate.isError;
  const error = scopeEstimate.error || contextEstimate.error;

  // Validation logic
  const getValidationStatus = () => {
    if (!combinedResult) return null;

    if (plan === 'starter') {
      if (fileCount > PLAN_LIMITS.starter.maxFilesPerScan) {
        return { valid: false, reason: 'file_limit' as const, message: `Launch plan allows only ${PLAN_LIMITS.starter.maxFilesPerScan} file per scan. You have ${fileCount} files in scope.` };
      }
      if (combinedResult.scopeNloc > PLAN_LIMITS.starter.nlocPerScan) {
        return { valid: false, reason: 'nloc_limit' as const, message: `Scope (${combinedResult.scopeNloc} nLOC) exceeds the ${PLAN_LIMITS.starter.nlocPerScan} nLOC limit per scan on Launch.` };
      }
      if (combinedResult.totalCredits > creditsRemaining) {
        return { valid: false, reason: 'credits' as const, message: `You need ${combinedResult.totalCredits} credits but only have ${creditsRemaining} remaining.` };
      }
      return { valid: true, message: 'Within your plan limits' };
    }

    if (plan === 'pro' || plan === 'business') {
      if (combinedResult.totalCredits > creditsRemaining) {
        return { valid: false, reason: 'credits' as const, message: `You need ${combinedResult.totalCredits} credits but only have ${creditsRemaining} remaining.` };
      }
      return { valid: true, message: `Will use ${combinedResult.totalCredits} of your ${creditsRemaining} credits` };
    }

    return { valid: true, message: 'Ready to analyze' };
  };

  const validation = getValidationStatus();

  const handleProceed = () => {
    if (!combinedResult || !validation) return;

    if (!validation.valid) {
      if (validation.reason === 'nloc_limit' || validation.reason === 'file_limit') {
        onUpgradeNeeded(validation.reason, combinedResult.totalCredits);
      } else if (validation.reason === 'credits') {
        onPowerUpNeeded(combinedResult.totalCredits);
      }
      return;
    }

    onProceed(combinedResult);
  };

  const handleRetry = () => {
    if (scopeEstimate.isError) {
      scopeEstimate.mutate(scopeFiles);
    } else if (contextEstimate.isError) {
      contextEstimate.mutate(contextFiles);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Code Analysis Estimate
        </h2>
        <p className="text-sm text-muted-foreground">
          Analyzing your code to estimate credits needed
        </p>
      </div>

      {/* Analysis Card */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        {isPending && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-foreground">
                {scopeEstimate.isPending ? 'Analyzing scope files...' : 'Analyzing context files...'}
              </span>
            </div>
            <Progress value={scopeEstimate.isPending ? 30 : 70} className="h-2" />
          </div>
        )}

        {isError && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Failed to analyze code</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'An error occurred while analyzing your code.'}
            </p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Retry Analysis
            </Button>
          </div>
        )}

        {combinedResult && !isPending && (
          <div className="space-y-4">
            {/* Credits Breakdown */}
            <div className="space-y-3">
              {/* Scope Files */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-foreground">Scope Files</span>
                  <span className="text-xs text-muted-foreground ml-2">({scopeFiles.length} files)</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{combinedResult.scopeNloc.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">nLOC</span>
                  <span className="text-xs text-primary ml-2">(100%)</span>
                </div>
              </div>

              {/* Context Files */}
              {contextFiles.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Context Files</span>
                    <span className="text-xs text-muted-foreground ml-2">({contextFiles.length} files)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-muted-foreground">{combinedResult.contextNloc.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">nLOC</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      → {Math.floor(combinedResult.contextNloc * CONTEXT_CREDIT_RATE).toLocaleString()} credits (35%)
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-semibold text-foreground">Total Credits</span>
                <span className="text-2xl font-bold text-primary">{combinedResult.totalCredits.toLocaleString()}</span>
              </div>
            </div>

            {/* Validation Status */}
            {validation && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                validation.valid 
                  ? 'bg-success/10 text-success' 
                  : 'bg-warning/10 text-warning'
              }`}>
                {validation.valid ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="text-sm">{validation.message}</span>
              </div>
            )}

            {/* Language Breakdown for Scope */}
            {Object.keys(combinedResult.scopeLanguages).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Scope Breakdown by Language</h4>
                <div className="space-y-1">
                  {Object.entries(combinedResult.scopeLanguages).map(([lang, stats]) => (
                    <div key={lang} className="flex items-center justify-between text-sm py-1">
                      <span className="text-foreground">{lang}</span>
                      <span className="text-muted-foreground">
                        {stats.code.toLocaleString()} lines ({stats.files} {stats.files === 1 ? 'file' : 'files'})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        {combinedResult && !isPending && (
          <Button
            onClick={handleProceed}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : validation && !validation.valid ? (
              <Zap className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {validation && !validation.valid 
              ? (validation.reason === 'credits' ? 'Get Power-Up' : 'Upgrade Plan')
              : 'Continue'
            }
          </Button>
        )}
      </div>
    </div>
  );
};

export default EstimatorStep;
