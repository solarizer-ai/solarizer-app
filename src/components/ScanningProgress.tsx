import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Shield, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface ScanningProgressProps {
  isScanning: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  findings?: Finding[];
  auditStatus?: 'pending' | 'analyzing' | 'secured' | 'issues' | null;
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-destructive text-destructive-foreground';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-warning text-warning-foreground';
    case 'low': return 'bg-blue-500 text-white';
    case 'info': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'high':
      return <AlertCircle className="w-3 h-3" />;
    case 'medium':
    case 'low':
      return <AlertTriangle className="w-3 h-3" />;
    default:
      return <Info className="w-3 h-3" />;
  }
};

const ScanningProgress = ({ 
  isScanning, 
  onComplete, 
  onCancel, 
  findings = [],
  auditStatus 
}: ScanningProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Count findings by severity
  const findingCounts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
  };
  const totalFindings = findings.length;

  // Cycle through steps continuously
  useEffect(() => {
    if (!isScanning || isComplete) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % scanSteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isScanning, isComplete]);

  // Reset state when scanning starts
  useEffect(() => {
    if (isScanning) {
      setIsComplete(false);
      setCurrentStep(0);
    }
  }, [isScanning]);

  // Check if audit is complete
  useEffect(() => {
    if (auditStatus === 'secured' || auditStatus === 'issues') {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [auditStatus, onComplete]);

  if (!isScanning && !isComplete) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/30 backdrop-blur-xl">
      <div className="relative w-full max-w-lg mx-4">
        {/* Main Container */}
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-card border border-border">
        
          {/* Solar Animation Container */}
          <div className="relative w-64 h-64 mb-8">
            {/* Outer Ring 3 - Slowest */}
            <div className="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-[spin_25s_linear_infinite_reverse]" />
            
            {/* Outer Ring 2 */}
            <div className="absolute inset-4 rounded-full border border-primary/30 animate-[spin_20s_linear_infinite]" />
            
            {/* Outer Ring 1 - Fastest outer */}
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-primary/40 animate-[spin_15s_linear_infinite_reverse]" />
            
            {/* Middle Glow Ring */}
            <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
            
            {/* Inner Ring */}
            <div className="absolute inset-16 rounded-full border border-primary/50 animate-[spin_10s_linear_infinite]" />
            
            {/* Core Glow Effect */}
            <div className="absolute inset-20 rounded-full bg-gradient-radial from-primary/30 via-primary/10 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />
            
            {/* Solar Core */}
            <div className="absolute inset-24 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 shadow-[0_0_60px_hsla(var(--primary)/0.5),0_0_100px_hsla(var(--primary)/0.3)] animate-[pulse_2s_ease-in-out_infinite]" />
            
            {/* Core Highlight */}
            <div className="absolute inset-[104px] rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />
            
            {/* Floating Particles */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/60 animate-[float-particle_3s_ease-in-out_infinite]" />
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-orange-400/70 animate-[float-particle_4s_ease-in-out_infinite_0.5s]" />
            <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-amber-400/80 animate-[float-particle_3.5s_ease-in-out_infinite_1s]" />
            <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-primary/50 animate-[float-particle_4.5s_ease-in-out_infinite_1.5s]" />
            <div className="absolute top-1/2 left-[15%] w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-[float-particle_3s_ease-in-out_infinite_2s]" />
            <div className="absolute top-[20%] right-[20%] w-1 h-1 rounded-full bg-amber-500/70 animate-[float-particle_5s_ease-in-out_infinite_0.8s]" />
            
            {/* Scan Line Effect */}
            <div className="absolute inset-16 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-1/3 animate-[scan-sweep_2.5s_ease-in-out_infinite]" />
            </div>

            {/* Orbiting Dots */}
            <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsla(var(--primary)/0.8)]" />
            </div>
            <div className="absolute inset-4 animate-[spin_12s_linear_infinite_reverse]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            </div>
            <div className="absolute inset-8 animate-[spin_6s_linear_infinite]">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
            
            {/* Finding Counter Overlay - Show when findings are coming in */}
            {totalFindings > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-lg">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-lg font-semibold text-foreground">{totalFindings}</span>
                  <span className="text-xs text-muted-foreground">found</span>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Intelligence Engine Active
          </h2>

          {/* Status Text with Fade Animation */}
          <div className="h-8 flex items-center justify-center mb-4">
            <p 
              key={currentStep} 
              className="text-sm font-mono text-primary animate-[fade-in_0.5s_ease-out]"
            >
              {scanSteps[currentStep]}
            </p>
          </div>

          {/* Real-time Finding Counts */}
          {totalFindings > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {findingCounts.critical > 0 && (
                <Badge className={cn("gap-1", getSeverityColor('critical'))}>
                  {getSeverityIcon('critical')}
                  {findingCounts.critical} Critical
                </Badge>
              )}
              {findingCounts.high > 0 && (
                <Badge className={cn("gap-1", getSeverityColor('high'))}>
                  {getSeverityIcon('high')}
                  {findingCounts.high} High
                </Badge>
              )}
              {findingCounts.medium > 0 && (
                <Badge className={cn("gap-1", getSeverityColor('medium'))}>
                  {getSeverityIcon('medium')}
                  {findingCounts.medium} Medium
                </Badge>
              )}
              {findingCounts.low > 0 && (
                <Badge className={cn("gap-1", getSeverityColor('low'))}>
                  {getSeverityIcon('low')}
                  {findingCounts.low} Low
                </Badge>
              )}
              {findingCounts.info > 0 && (
                <Badge className={cn("gap-1", getSeverityColor('info'))}>
                  {getSeverityIcon('info')}
                  {findingCounts.info} Info
                </Badge>
              )}
            </div>
          )}

          {/* Decorative Line */}
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

          {/* Cancel Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Cancel Analysis
          </Button>

          {/* Credit Warning */}
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 max-w-sm">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning">
              Credits are consumed when analysis starts and will not be refunded if cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningProgress;
