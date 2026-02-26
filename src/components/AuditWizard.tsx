import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileNode, getAllFiles } from "@/types/files";
import ProjectNameStep from "./wizard/ProjectNameStep";
import UploadMethodStep, { UploadMethod } from "./wizard/UploadMethodStep";
import ScopeSelectionStep from "./wizard/ScopeSelectionStep";
import EstimatorStep from "./wizard/EstimatorStep";
import ContextStep from "./wizard/ContextStep";
import GitHubImportStep from "./wizard/GitHubImportStep";
import FolderUploader from "./FolderUploader";

interface CombinedClocResult {
  scopeNloc: number; contextNloc: number; totalCredits: number;
  scopeLanguages: Record<string, { files: number; code: number }>;
  contextLanguages: Record<string, { files: number; code: number }>;
}

interface AuditWizardProps {
  onComplete: (data: { projectName: string; files: FileNode[]; additionalContext?: string; scope: string[] }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  subscription?: { plan: 'starter' | 'pro' | 'business' } | null;
  credits?: { credits_remaining: number; scans_remaining: number } | null;
  onUpgradeNeeded?: (reason: 'nloc_limit' | 'file_limit', nloc: number) => void;
  onPowerUpNeeded?: (nloc: number) => void;
  onProjectNameChange?: (name: string) => void;
}

type WizardStep = 'name' | 'method' | 'input' | 'scope' | 'estimate' | 'context';

const AuditWizard = ({ onComplete, onCancel, isSubmitting = false, subscription, credits, onUpgradeNeeded, onPowerUpNeeded, onProjectNameChange }: AuditWizardProps) => {
  const [step, setStep] = useState<WizardStep>('name');
  const [projectName, setProjectName] = useState("");
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [combinedClocResult, setCombinedClocResult] = useState<CombinedClocResult | null>(null);
  const [selectedScope, setSelectedScope] = useState<string[]>([]);

  const handleProjectNameChange = (name: string) => { setProjectName(name); onProjectNameChange?.(name); };
  const handleMethodSelect = (method: UploadMethod) => { setUploadMethod(method); setStep('input'); };

  const handleBack = () => {
    if (step === 'method') setStep('name');
    else if (step === 'input') { setStep('method'); setFiles([]); setSelectedScope([]); }
    else if (step === 'scope') setStep('input');
    else if (step === 'estimate') setStep('scope');
    else if (step === 'context') setStep('estimate');
  };

  const handleProceedToScope = () => {
    const solFiles = getAllFiles(files).filter(f => f.name.endsWith('.sol')).map(f => f.path);
    setSelectedScope(solFiles);
    setStep('scope');
  };

  const handleEstimateComplete = (result: CombinedClocResult) => { setCombinedClocResult(result); setStep('context'); };

  const handleContextComplete = () => { onComplete({ projectName, files, additionalContext: additionalContext || undefined, scope: selectedScope }); };

  const handleGitHubFilesImported = (importedFiles: FileNode[]) => {
    setFiles(importedFiles);
    setSelectedScope(getAllFiles(importedFiles).filter(f => f.name.endsWith('.sol')).map(f => f.path));
    setStep('scope');
  };

  const getScopeFilesForEstimation = () => getAllFiles(files).filter(f => selectedScope.includes(f.path)).map(f => ({ name: f.name, content: f.content || '' }));
  const getContextFilesForEstimation = () => getAllFiles(files).filter(f => !selectedScope.includes(f.path) && f.name.endsWith('.sol')).map(f => ({ name: f.name, content: f.content || '' }));

  const getStepNumber = (): number => {
    switch (step) { case 'name': return 1; case 'method': return 2; case 'input': return 3; case 'scope': return 4; case 'estimate': return 5; case 'context': return 6; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="flex items-center gap-1 sm:gap-2">
            <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors", getStepNumber() >= num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{num}</div>
            {num < 6 && <div className={cn("w-6 sm:w-12 h-0.5 transition-colors", getStepNumber() > num ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <div className="min-h-[300px] sm:min-h-[400px]">
        {step === 'name' && <ProjectNameStep projectName={projectName} onProjectNameChange={handleProjectNameChange} onContinue={() => setStep('method')} />}
        {step === 'method' && <UploadMethodStep onSelectMethod={handleMethodSelect} onBack={handleBack} isStarterPlan={subscription?.plan === 'starter' || !subscription} />}
        {step === 'input' && uploadMethod === 'folder' && (
          <div className="space-y-6">
            <div className="text-center space-y-2"><h2 className="text-2xl font-semibold text-foreground">Upload your project</h2><p className="text-sm text-muted-foreground">Drag & drop your project folder or click to browse</p></div>
            <FolderUploader onFilesUploaded={setFiles} uploadedFiles={files} onClear={() => setFiles([])} />
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
              <Button onClick={handleProceedToScope} disabled={files.length === 0 || getAllFiles(files).length === 0} className="gap-2"><Play className="w-4 h-4" />Continue</Button>
            </div>
          </div>
        )}
        {step === 'input' && uploadMethod === 'github' && <GitHubImportStep onFilesImported={handleGitHubFilesImported} onBack={handleBack} />}
        {step === 'scope' && <ScopeSelectionStep fileTree={files} selectedScope={selectedScope} onScopeChange={setSelectedScope} onBack={handleBack} onProceed={() => setStep('estimate')} />}
        {step === 'estimate' && <EstimatorStep scopeFiles={getScopeFilesForEstimation()} contextFiles={getContextFilesForEstimation()} onBack={handleBack} onProceed={handleEstimateComplete} onUpgradeNeeded={(r, n) => onUpgradeNeeded?.(r, n)} onPowerUpNeeded={(n) => onPowerUpNeeded?.(n)} subscription={subscription} credits={credits} isSubmitting={false} />}
        {step === 'context' && <ContextStep additionalContext={additionalContext} onContextChange={setAdditionalContext} onBack={handleBack} onProceed={handleContextComplete} isSubmitting={isSubmitting} nloc={combinedClocResult?.totalCredits || 0} />}
      </div>
    </div>
  );
};

export default AuditWizard;
