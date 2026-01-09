import { useState } from "react";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileNode, createFileNode, getAllFiles } from "@/types/files";
import ProjectNameStep from "./wizard/ProjectNameStep";
import UploadMethodStep, { UploadMethod } from "./wizard/UploadMethodStep";
import EstimatorStep from "./wizard/EstimatorStep";
import FolderUploader from "./FolderUploader";
import CodeEditor from "./CodeEditor";
import { ClocResult } from "@/hooks/useClocEstimate";

interface AuditWizardProps {
  onComplete: (data: { projectName: string; files: FileNode[]; code: string; clocResult?: ClocResult }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  subscription?: { plan: 'starter' | 'pro' } | null;
  credits?: { credits_remaining: number } | null;
  scanCount?: number | null;
  onUpgradeNeeded?: (reason: 'scan_limit' | 'nloc_limit', nloc: number) => void;
  onPowerUpNeeded?: (nloc: number) => void;
}

type WizardStep = 'name' | 'method' | 'input' | 'estimate';

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
  scanCount,
  onUpgradeNeeded,
  onPowerUpNeeded,
}: AuditWizardProps) => {
  const [step, setStep] = useState<WizardStep>('name');
  const [projectName, setProjectName] = useState("");
  const [uploadMethod, setUploadMethod] = useState<UploadMethod | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [editorCode, setEditorCode] = useState(SAMPLE_CODE);

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
    } else if (step === 'estimate') {
      setStep('input');
    }
  };

  const handleProceedToEstimate = () => {
    setStep('estimate');
  };

  const handleEstimateComplete = (clocResult: ClocResult) => {
    // Collect all code from files
    const allFiles = getAllFiles(files);
    const combinedCode = allFiles.map(f => f.content || '').join('\n\n');
    
    onComplete({
      projectName,
      files,
      code: combinedCode || editorCode,
      clocResult,
    });
  };

  const handleUpgradeNeeded = (reason: 'scan_limit' | 'nloc_limit', nloc: number) => {
    onUpgradeNeeded?.(reason, nloc);
  };

  const handlePowerUpNeeded = (nloc: number) => {
    onPowerUpNeeded?.(nloc);
  };

  const canProceedToEstimate = () => {
    if (uploadMethod === 'folder') {
      return files.length > 0 && getAllFiles(files).length > 0;
    }
    return files.length > 0 && getAllFiles(files).some(f => f.content?.trim());
  };

  const getFilesForEstimation = () => {
    const allFiles = getAllFiles(files);
    return allFiles.map(f => ({
      name: f.name,
      content: f.content || '',
    }));
  };

  const getStepNumber = (): number => {
    switch (step) {
      case 'name': return 1;
      case 'method': return 2;
      case 'input': return 3;
      case 'estimate': return 4;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((num) => (
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
            {num < 4 && (
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
            onProjectNameChange={setProjectName}
            onContinue={() => setStep('method')}
          />
        )}

        {step === 'method' && (
          <UploadMethodStep
            onSelectMethod={handleMethodSelect}
            onBack={handleBack}
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
                onClick={handleProceedToEstimate}
                disabled={!canProceedToEstimate()}
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
                onClick={handleProceedToEstimate}
                disabled={!canProceedToEstimate()}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Continue
              </Button>
            </div>

            <CodeEditor
              files={files}
              onFilesChange={setFiles}
              showExplorer={true}
            />
          </div>
        )}

        {step === 'estimate' && (
          <EstimatorStep
            files={getFilesForEstimation()}
            onBack={handleBack}
            onProceed={handleEstimateComplete}
            onUpgradeNeeded={handleUpgradeNeeded}
            onPowerUpNeeded={handlePowerUpNeeded}
            subscription={subscription}
            credits={credits}
            scanCount={scanCount}
            isSubmitting={isSubmitting}
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
