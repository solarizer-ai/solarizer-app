import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, ArrowRight, FileCode, Info, ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileNode, getAllFiles } from "@/types/files";

interface ScopeSelectionStepProps {
  fileTree: FileNode[];
  selectedScope: string[];
  onScopeChange: (scope: string[]) => void;
  onBack: () => void;
  onProceed: () => void;
}

interface ScopeTreeItemProps {
  node: FileNode; depth: number; selectedScope: string[]; expandedFolders: Set<string>;
  onToggleFile: (fileName: string) => void; onToggleFolder: (folderPath: string, fileNames: string[]) => void;
  onToggleExpand: (folderPath: string) => void; getSolidityFilesInFolder: (node: FileNode) => string[];
}

const ScopeTreeItem = ({ node, depth, selectedScope, expandedFolders, onToggleFile, onToggleFolder, onToggleExpand, getSolidityFilesInFolder }: ScopeTreeItemProps) => {
  if (node.type === 'file') {
    if (!node.name.endsWith('.sol')) return null;
    const isSelected = selectedScope.includes(node.path);
    const lineCount = node.content?.split('\n').length || 0;
    const bytes = new Blob([node.content || '']).size;
    const fileSize = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
    return (
      <div onClick={() => onToggleFile(node.path)} className={cn("flex items-center gap-3 py-2 px-3 cursor-pointer transition-colors rounded-md mx-1", isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50")} style={{ paddingLeft: `${depth * 20 + 12}px` }}>
        <Checkbox checked={isSelected} onCheckedChange={() => onToggleFile(node.path)} className="data-[state=checked]:bg-primary" />
        <FileCode className="w-4 h-4 text-primary shrink-0" />
        <span className={cn("text-sm font-medium truncate flex-1", isSelected ? "text-foreground" : "text-muted-foreground")}>{node.name}</span>
        <div className="text-right shrink-0 text-xs text-muted-foreground"><span>{lineCount} lines</span><span className="mx-1">·</span><span>{fileSize}</span></div>
      </div>
    );
  }

  const solidityFilesInFolder = getSolidityFilesInFolder(node);
  if (solidityFilesInFolder.length === 0) return null;
  const selectedCount = solidityFilesInFolder.filter(f => selectedScope.includes(f)).length;
  const allSelected = selectedCount === solidityFilesInFolder.length;
  const someSelected = selectedCount > 0 && selectedCount < solidityFilesInFolder.length;
  const isExpanded = expandedFolders.has(node.path);

  return (
    <div>
      <div className={cn("flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors rounded-md mx-1 hover:bg-muted/50", someSelected && "bg-muted/30")} style={{ paddingLeft: `${depth * 20 + 12}px` }}>
        <Checkbox checked={allSelected} data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"} onCheckedChange={() => onToggleFolder(node.path, solidityFilesInFolder)} className={cn("data-[state=checked]:bg-primary", someSelected && "data-[state=indeterminate]:bg-primary/50")} />
        <div className="flex items-center gap-2 flex-1" onClick={(e) => { e.stopPropagation(); onToggleExpand(node.path); }}>
          {isExpanded ? <><ChevronDown className="w-4 h-4 text-muted-foreground" /><FolderOpen className="w-4 h-4 text-amber-500" /></> : <><ChevronRight className="w-4 h-4 text-muted-foreground" /><Folder className="w-4 h-4 text-amber-500" /></>}
          <span className="text-sm font-medium text-foreground truncate">{node.name}</span>
          <span className="text-xs text-muted-foreground">({selectedCount}/{solidityFilesInFolder.length})</span>
        </div>
      </div>
      {isExpanded && node.children && node.children.map((child) => (
        <ScopeTreeItem key={child.id} node={child} depth={depth + 1} selectedScope={selectedScope} expandedFolders={expandedFolders} onToggleFile={onToggleFile} onToggleFolder={onToggleFolder} onToggleExpand={onToggleExpand} getSolidityFilesInFolder={getSolidityFilesInFolder} />
      ))}
    </div>
  );
};

const ScopeSelectionStep = ({ fileTree, selectedScope, onScopeChange, onBack, onProceed }: ScopeSelectionStepProps) => {
  const allSolidityFiles = useMemo(() => getAllFiles(fileTree).filter(f => f.name.endsWith('.sol')), [fileTree]);
  const allSolidityFilePaths = useMemo(() => allSolidityFiles.map(f => f.path), [allSolidityFiles]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set(fileTree.filter(n => n.type === 'folder').map(n => n.path)));

  const allSelected = allSolidityFilePaths.length > 0 && selectedScope.length === allSolidityFilePaths.length;
  const someSelected = selectedScope.length > 0 && selectedScope.length < allSolidityFilePaths.length;

  const handleToggleAll = () => onScopeChange(allSelected ? [] : allSolidityFilePaths);
  const handleToggleFile = useCallback((fileName: string) => { onScopeChange(selectedScope.includes(fileName) ? selectedScope.filter(f => f !== fileName) : [...selectedScope, fileName]); }, [selectedScope, onScopeChange]);
  const handleToggleFolder = useCallback((folderPath: string, fileNames: string[]) => { const allInFolder = fileNames.every(f => selectedScope.includes(f)); onScopeChange(allInFolder ? selectedScope.filter(f => !fileNames.includes(f)) : Array.from(new Set([...selectedScope, ...fileNames]))); }, [selectedScope, onScopeChange]);
  const handleToggleExpand = useCallback((folderPath: string) => { setExpandedFolders(prev => { const next = new Set(prev); next.has(folderPath) ? next.delete(folderPath) : next.add(folderPath); return next; }); }, []);
  const getSolidityFilesInFolder = useCallback((node: FileNode): string[] => { if (node.type === 'file') return node.name.endsWith('.sol') ? [node.path] : []; return node.children?.flatMap(child => getSolidityFilesInFolder(child)) || []; }, []);

  const hasTreeStructure = fileTree.some(n => n.type === 'folder');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Select Audit Scope</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Choose which contracts are in scope for security analysis.</p>
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">In-scope files</span> are fully analyzed (100% credits). <span className="font-medium text-foreground">Out-of-scope files</span> are sent as context only (35% credits).</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Checkbox checked={allSelected} data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"} onCheckedChange={handleToggleAll} className="data-[state=checked]:bg-primary" />
            <span className="text-sm font-medium text-foreground">{allSelected ? "Deselect All" : "Select All"}</span>
          </div>
          <div className="text-sm text-muted-foreground">{selectedScope.length} of {allSolidityFilePaths.length} in scope</div>
        </div>
        <ScrollArea className="h-[300px]">
          {allSolidityFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center"><FileCode className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No Solidity files found</p></div>
          ) : hasTreeStructure ? (
            <div className="py-2">{fileTree.map((node) => <ScopeTreeItem key={node.id} node={node} depth={0} selectedScope={selectedScope} expandedFolders={expandedFolders} onToggleFile={handleToggleFile} onToggleFolder={handleToggleFolder} onToggleExpand={handleToggleExpand} getSolidityFilesInFolder={getSolidityFilesInFolder} />)}</div>
          ) : (
            <div className="py-2">{allSolidityFiles.map((file) => { const isSelected = selectedScope.includes(file.path); const lineCount = file.content?.split('\n').length || 0; return (
              <div key={file.id} onClick={() => handleToggleFile(file.path)} className={cn("flex items-center gap-3 py-2 px-4 cursor-pointer transition-colors", isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50")}>
                <Checkbox checked={isSelected} onCheckedChange={() => handleToggleFile(file.path)} className="data-[state=checked]:bg-primary" />
                <FileCode className="w-4 h-4 text-primary shrink-0" /><span className={cn("text-sm font-medium truncate flex-1", isSelected ? "text-foreground" : "text-muted-foreground")}>{file.name}</span>
                <span className="text-xs text-muted-foreground">{lineCount} lines</span>
              </div>
            ); })}</div>
          )}
        </ScrollArea>
      </div>
      {selectedScope.length === 0 && allSolidityFiles.length > 0 && <p className="text-sm text-destructive text-center">Please select at least 1 contract to include in scope</p>}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <Button onClick={onProceed} disabled={selectedScope.length === 0} className="gap-2">Continue<ArrowRight className="w-4 h-4" /></Button>
      </div>
    </div>
  );
};

export default ScopeSelectionStep;
