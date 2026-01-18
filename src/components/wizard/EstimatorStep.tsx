import { useEffect } from "react";
import { ArrowLeft, Play, Loader2, Check, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClocEstimate, FileInput, ClocResult } from "@/hooks/useClocEstimate";
import { PLAN_LIMITS } from "@/lib/nlocCalculator";

interface EstimatorStepProps {
  files: FileInput[];
  onBack: () => void;
  onProceed: (clocResult: ClocResult) => void;
  onUpgradeNeeded: (reason: 'scan_limit' | 'nloc_limit', nloc: number) => void;
  onPowerUpNeeded: (nloc: number) => void;
  subscription: { plan: 'starter' | 'pro' | 'business' } | null | undefined;
  credits: { credits_remaining: number; scans_remaining: number } | null | undefined;
  isSubmitting?: boolean;
}

const EstimatorStep = ({
  files,
  onBack,
  onProceed,
  onUpgradeNeeded,
  onPowerUpNeeded,
  subscription,
  credits,
  isSubmitting = false,
}: EstimatorStepProps) => {
  const clocEstimate = useClocEstimate();
  const { data: clocResult, isPending, isError, error } = clocEstimate;

  // Auto-trigger estimation when component mounts
  useEffect(() => {
    if (files.length > 0 && !clocResult && !isPending && !isError) {
      clocEstimate.mutate(files);
    }
  }, [files, clocResult, isPending, isError]);

  const plan = subscription?.plan || 'starter';
  const scansRemaining = credits?.scans_remaining ?? 0;
  const creditsRemaining = credits?.credits_remaining ?? 0;
  const totalNloc = clocResult?.totalNloc || 0;

  const fileCount = files.length;

  // Validation logic
  const getValidationStatus = () => {
    if (!clocResult) return null;

    if (plan === 'starter') {
      if (scansRemaining <= 0) {
        return { valid: false, reason: 'scan_limit' as const, message: 'You have no scans remaining on your Starter plan.' };
      }
      if (fileCount > PLAN_LIMITS.starter.maxFilesPerScan) {
        return { valid: false, reason: 'file_limit' as const, message: `Starter plan allows only ${PLAN_LIMITS.starter.maxFilesPerScan} file per scan. You have ${fileCount} files.` };
      }
      if (totalNloc > PLAN_LIMITS.starter.nlocPerScan) {
        return { valid: false, reason: 'nloc_limit' as const, message: `This project (${totalNloc} nLOC) exceeds the ${PLAN_LIMITS.starter.nlocPerScan} nLOC limit per scan on Starter.` };
      }
      return { valid: true, message: `Within your plan limit (${scansRemaining} scan${scansRemaining !== 1 ? 's' : ''} remaining)` };
    }

    if (plan === 'pro' || plan === 'business') {
      if (totalNloc > creditsRemaining) {
        return { valid: false, reason: 'credits' as const, message: `You need ${totalNloc} credits but only have ${creditsRemaining} remaining.` };
      }
      return { valid: true, message: `Will use ${totalNloc} of your ${creditsRemaining} credits` };
    }

    return { valid: true, message: 'Ready to analyze' };
  };

  const validation = getValidationStatus();

  const handleProceed = () => {
    if (!clocResult || !validation) return;

    if (!validation.valid) {
      if (validation.reason === 'scan_limit' || validation.reason === 'nloc_limit' || validation.reason === 'file_limit') {
        onUpgradeNeeded(validation.reason as 'scan_limit' | 'nloc_limit', totalNloc);
      } else if (validation.reason === 'credits') {
        onPowerUpNeeded(totalNloc);
      }
      return;
    }

    onProceed(clocResult);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Code Analysis Estimate
        </h2>
        <p className="text-sm text-muted-foreground">
          Analyzing your code to estimate lines of code
        </p>
      </div>

      {/* Analysis Card */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        {isPending && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-foreground">Analyzing your code...</span>
            </div>
            <Progress value={45} className="h-2" />
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
              onClick={() => clocEstimate.mutate(files)}
              className="gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Retry Analysis
            </Button>
          </div>
        )}

        {clocResult && (
          <div className="space-y-4">
            {/* Total nLOC */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Total nLOC</span>
              <span className="text-2xl font-bold text-foreground">{totalNloc.toLocaleString()}</span>
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

            {/* Language Breakdown */}
            {Object.keys(clocResult.languages).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Breakdown by Language</h4>
                <div className="space-y-1">
                  {Object.entries(clocResult.languages).map(([lang, stats]) => (
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        {clocResult && (
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
              : 'Start Analysis'
            }
          </Button>
        )}
      </div>
    </div>
  );
};

export default EstimatorStep;
