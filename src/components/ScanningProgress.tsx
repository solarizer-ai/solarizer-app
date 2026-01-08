import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScanningProgressProps {
  isScanning: boolean;
  onComplete?: () => void;
}

const scanSteps = [
  "Parsing contract structure...",
  "Deconstructing logic...",
  "Mapping function dependencies...",
  "Cross-referencing verified patterns...",
  "Analyzing access controls...",
  "Checking reentrancy vectors...",
  "Simulating edge cases...",
  "Validating arithmetic operations...",
  "Generating security report...",
];

const ScanningProgress = ({ isScanning, onComplete }: ScanningProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 8 + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          onComplete?.();
          return 100;
        }
        return newProgress;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isScanning, onComplete]);

  useEffect(() => {
    const stepIndex = Math.min(
      Math.floor((progress / 100) * scanSteps.length),
      scanSteps.length - 1
    );
    setCurrentStep(stepIndex);
  }, [progress]);

  if (!isScanning && progress === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div 
              className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"
              style={{ display: progress === 100 ? 'none' : 'block' }}
            />
            {progress === 100 && (
              <div className="absolute inset-0 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {progress === 100 ? "Analysis Complete" : "Intelligence Engine Active"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scanSteps[currentStep]}
            </p>
          </div>
        </div>
        <span className="text-sm font-mono text-primary">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out",
            progress === 100 ? "bg-success" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
        {progress < 100 && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanningProgress;
