import { useState } from "react";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileNode, createFileNode, getAllFiles, mergeFileTrees } from "@/types/files";
import ProjectNameStep from "./wizard/ProjectNameStep";
import UploadMethodStep, { UploadMethod } from "./wizard/UploadMethodStep";
import ScopeSelectionStep from "./wizard/ScopeSelectionStep";
import EstimatorStep from "./wizard/EstimatorStep";
import ContextStep from "./wizard/ContextStep";
import GitHubImportStep from "./wizard/GitHubImportStep";
import FolderUploader from "./FolderUploader";
import SandpackEditor from "./SandpackEditor";
import { ClocResult } from "@/hooks/useClocEstimate";

interface CombinedClocResult {
  scopeNloc: number;
  contextNloc: number;
  totalCredits: number;
  scopeLanguages: ClocResult['languages'];
  contextLanguages: ClocResult['languages'];
}

interface AuditWizardProps {
  onComplete: (data: { 
    projectName: string; 
    files: FileNode[]; 
    code: string; 
    clocResult?: ClocResult;
    additionalContext?: string;
    scope?: string[];
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  subscription?: { plan: 'starter' | 'pro' | 'business' } | null;
  credits?: { credits_remaining: number; scans_remaining: number } | null;
  onUpgradeNeeded?: (reason: 'nloc_limit' | 'file_limit', nloc: number) => void;
  onPowerUpNeeded?: (nloc: number) => void;
  onProjectNameChange?: (name: string) => void;
}

type WizardStep = 'name' | 'method' | 'input' | 'scope' | 'estimate' | 'context';

const SAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyContract {
    // Your smart contract code here
}`;

const AuditWizard = ({ 
  onComplete, 
  onCancel, 
  isSubmitting = false,
  subscription,
  credits,
  onUpgradeNeeded,
  onPowerUpNeeded,
  onProjectNameChange,
}: AuditWizardProps) => {
  const [step, setStep] = useState<WizardStep>('name');
  const [projectName, setProjectName] = useState("");
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [editorCode, setEditorCode] = useState(SAMPLE_CODE);
  const [additionalContext, setAdditionalContext] = useState("");
  const [combinedClocResult, setCombinedClocResult] = useState<CombinedClocResult | null>(null);
  const [selectedScope, setSelectedScope] = useState<string[]>([]);

  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    onProjectNameChange?.(name);
  };
  const handleMethodSelect = (method: UploadMethod) => {
    setUploadMethod(method);
    if (method === 'editor') {
      // Initialize with a default file
      setFiles([createFileNode(`${projectName || 'Contract'}.sol`, `${projectName || 'Contract'}.sol`, SAMPLE_CODE)]);
    }
    setStep('input');
  };

  const handleBack = () => {
    if (step === 'method') {
      setStep('name');
    } else if (step === 'input') {
      setStep('method');
      setFiles([]);
      setSelectedScope([]);
    } else if (step === 'scope') {
      setStep('input');
    } else if (step === 'estimate') {
      setStep('scope');
    } else if (step === 'context') {
      setStep('estimate');
    }
  };

  const handleProceedToScope = () => {
    // Auto-select all Solidity files when entering scope step (using paths)
    const allFiles = getAllFiles(files);
    const solFiles = allFiles.filter(f => f.name.endsWith('.sol')).map(f => f.path);
    setSelectedScope(solFiles);
    setStep('scope');
  };

  const handleScopeProceed = () => {
    setStep('estimate');
  };

  const handleEstimateComplete = (result: CombinedClocResult) => {
    setCombinedClocResult(result);
    setStep('context');
  };

  const handleContextComplete = () => {
    const allFiles = getAllFiles(files);
    const combinedCode = allFiles.map(f => f.content || '').join('\n\n');
    
    // Convert combined result back to ClocResult format for compatibility
    const clocResult: ClocResult = {
      totalNloc: combinedClocResult?.totalCredits || 0,
      languages: combinedClocResult?.scopeLanguages || {},
    };
    
    onComplete({
      projectName,
      files,
      code: combinedCode || editorCode,
      clocResult,
      additionalContext: additionalContext || undefined,
      scope: selectedScope,
    });
  };

  const handleGitHubFilesImported = (importedFiles: FileNode[]) => {
    // Replace files entirely (don't merge with previous imports)
    setFiles(importedFiles);
    // Auto-select all Solidity files when entering scope step (using paths)
    const allFiles = getAllFiles(importedFiles);
    const solFiles = allFiles.filter(f => f.name.endsWith('.sol')).map(f => f.path);
    setSelectedScope(solFiles);
    setStep('scope');
  };

  const handleUpgradeNeeded = (reason: 'nloc_limit' | 'file_limit', nloc: number) => {
    onUpgradeNeeded?.(reason, nloc);
  };

  const handlePowerUpNeeded = (nloc: number) => {
    onPowerUpNeeded?.(nloc);
  };

  const canProceedToScope = () => {
    if (uploadMethod === 'folder') {
      return files.length > 0 && getAllFiles(files).length > 0;
    }
    return files.length > 0 && getAllFiles(files).some(f => f.content?.trim());
  };

  // Get in-scope files for nLOC estimation (100% credits)
  const getScopeFilesForEstimation = () => {
    const allFiles = getAllFiles(files);
    return allFiles
      .filter(f => selectedScope.includes(f.path))
      .map(f => ({
        name: f.name,
        content: f.content || '',
      }));
  };

  // Get out-of-scope Solidity files for context estimation (35% credits)
  const getContextFilesForEstimation = () => {
    const allFiles = getAllFiles(files);
    return allFiles
      .filter(f => !selectedScope.includes(f.path) && f.name.endsWith('.sol'))
      .map(f => ({
        name: f.name,
        content: f.content || '',
      }));
  };

  const getStepNumber = (): number => {
    switch (step) {
      case 'name': return 1;
      case 'method': return 2;
      case 'input': return 3;
      case 'scope': return 4;
      case 'estimate': return 5;
      case 'context': return 6;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                getStepNumber() >= num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {num}
            </div>
            {num < 6 && (
              <div
                className={cn(
                  "w-12 h-0.5 transition-colors",
                  getStepNumber() > num ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 'name' && (
          <ProjectNameStep
            projectName={projectName}
            onProjectNameChange={handleProjectNameChange}
            onContinue={() => setStep('method')}
          />
        )}

        {step === 'method' && (
          <UploadMethodStep
            onSelectMethod={handleMethodSelect}
            onBack={handleBack}
            isStarterPlan={subscription?.plan === 'starter' || !subscription}
          />
        )}

        {step === 'input' && uploadMethod === 'folder' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Upload your project
              </h2>
              <p className="text-sm text-muted-foreground">
                Drag & drop your project folder or click to browse
              </p>
            </div>

            <FolderUploader
              onFilesUploaded={setFiles}
              uploadedFiles={files}
              onClear={() => setFiles([])}
            />

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleProceedToScope}
                disabled={!canProceedToScope()}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'input' && uploadMethod === 'editor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleProceedToScope}
                disabled={!canProceedToScope()}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Continue
              </Button>
            </div>

            <SandpackEditor
              files={files}
              onFilesChange={setFiles}
              showExplorer={true}
              readOnly={false}
            />
          </div>
        )}

        {step === 'input' && uploadMethod === 'github' && (
          <GitHubImportStep
            onFilesImported={handleGitHubFilesImported}
            onBack={handleBack}
          />
        )}

        {step === 'scope' && (
          <ScopeSelectionStep
            fileTree={files}
            selectedScope={selectedScope}
            onScopeChange={setSelectedScope}
            onBack={handleBack}
            onProceed={handleScopeProceed}
          />
        )}

        {step === 'estimate' && (
          <EstimatorStep
            scopeFiles={getScopeFilesForEstimation()}
            contextFiles={getContextFilesForEstimation()}
            onBack={handleBack}
            onProceed={handleEstimateComplete}
            onUpgradeNeeded={handleUpgradeNeeded}
            onPowerUpNeeded={handlePowerUpNeeded}
            subscription={subscription}
            credits={credits}
            isSubmitting={false}
          />
        )}

        {step === 'context' && (
          <ContextStep
            additionalContext={additionalContext}
            onContextChange={setAdditionalContext}
            onBack={handleBack}
            onProceed={handleContextComplete}
            isSubmitting={isSubmitting}
            nloc={combinedClocResult?.totalCredits || 0}
          />
        )}
      </div>

      {/* Cancel */}
      {step === 'name' && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditWizard;
