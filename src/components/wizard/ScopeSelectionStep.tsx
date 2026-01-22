import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckSquare, Square, FileCode, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FileItem {
  name: string;
  content: string;
  path?: string;
}

interface ScopeSelectionStepProps {
  files: FileItem[];
  selectedScope: string[];
  onScopeChange: (scope: string[]) => void;
  onBack: () => void;
  onProceed: () => void;
}

const ScopeSelectionStep = ({
  files,
  selectedScope,
  onScopeChange,
  onBack,
  onProceed,
}: ScopeSelectionStepProps) => {
  // Filter to only show Solidity files
  const solidityFiles = useMemo(() => 
    files.filter(f => f.name.endsWith('.sol')),
    [files]
  );

  const allSelected = solidityFiles.length > 0 && selectedScope.length === solidityFiles.length;
  const someSelected = selectedScope.length > 0 && selectedScope.length < solidityFiles.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onScopeChange([]);
    } else {
      onScopeChange(solidityFiles.map(f => f.name));
    }
  };

  const handleToggleFile = (fileName: string) => {
    if (selectedScope.includes(fileName)) {
      onScopeChange(selectedScope.filter(f => f !== fileName));
    } else {
      onScopeChange([...selectedScope, fileName]);
    }
  };

  const getFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getLineCount = (content: string) => {
    return content.split('\n').length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Select Audit Scope
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Choose which contracts are in scope for security analysis. 
          Only in-scope files count toward your nLOC credits.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">All files</span> will be sent for context, 
            but only <span className="font-medium text-foreground">in-scope files</span> will be 
            analyzed for vulnerabilities and count toward your credits.
          </p>
        </div>
      </div>

      {/* Selection Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Header with Select All */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleToggleAll}
              className="data-[state=checked]:bg-primary"
            />
            <span className="text-sm font-medium text-foreground">
              {allSelected ? "Deselect All" : "Select All"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedScope.length} of {solidityFiles.length} selected
          </div>
        </div>

        {/* File List */}
        <ScrollArea className="h-[300px]">
          {solidityFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <FileCode className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No Solidity files found in your project
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {solidityFiles.map((file) => {
                const isSelected = selectedScope.includes(file.name);
                return (
                  <div
                    key={file.name}
                    onClick={() => handleToggleFile(file.name)}
                    className={cn(
                      "flex items-center gap-4 p-4 cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-primary/5 hover:bg-primary/10" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleFile(file.name)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-primary shrink-0" />
                        <span className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {file.name}
                        </span>
                      </div>
                      {file.path && file.path !== file.name && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {file.path}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {getLineCount(file.content)} lines
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFileSize(file.content)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onProceed}
          disabled={selectedScope.length === 0}
          className="gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ScopeSelectionStep;
