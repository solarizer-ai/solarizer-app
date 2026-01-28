import { useMemo } from "react";
import { FileCode, FileText, FolderOpen, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoverageData } from "@/components/SecurityCoverageTab";
import type { Finding, AuditStatus } from "@/hooks/useAudits";

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  status: 'context' | 'pending' | 'analysed';
}

interface ScopeTabProps {
  coverageData: CoverageData | null;
  findings: Finding[];
  contractCount: number;
  nlocCount: number | null;
  readOnly?: boolean;
  auditStatus?: AuditStatus;
  systemHologram?: {
    scope?: string[];
    all_files?: string[];
  } | null;
}

// Build a hierarchical tree from flat file paths
function buildFileTree(
  allFiles: string[], 
  scopeFiles: string[], 
  getFileStatus: (path: string) => 'context' | 'pending' | 'analysed'
): TreeNode[] {
  const root: TreeNode[] = [];
  
  for (const filePath of allFiles) {
    const parts = filePath.split('/');
    let currentLevel = root;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      
      let existing = currentLevel.find(node => node.name === part && node.isFile === isFile);
      
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFile,
          children: [],
          status: isFile ? getFileStatus(filePath) : 'context',
        };
        currentLevel.push(existing);
      }
      
      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }
  
  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };
  
  return sortNodes(root);
}

const FileTreeNode = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const paddingLeft = depth * 16;
  
  if (!node.isFile) {
    // Folder node
    return (
      <div>
        <div 
          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <FolderOpen className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="text-sm font-medium text-foreground">{node.name}</span>
        </div>
        {node.children.map((child) => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }
  
  // File node
  return (
    <div 
      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-mono text-foreground truncate">{node.name}</span>
      </div>
      <div className="shrink-0">
        {node.status === 'context' && (
          <Info className="w-4 h-4 text-muted-foreground" />
        )}
        {node.status === 'pending' && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
        )}
        {node.status === 'analysed' && (
          <CheckCircle2 className="w-4 h-4 text-success" />
        )}
      </div>
    </div>
  );
};

const ScopeTab = ({ 
  coverageData, 
  findings, 
  contractCount, 
  nlocCount, 
  readOnly = false,
  auditStatus,
  systemHologram,
}: ScopeTabProps) => {
  // Determine file status based on scope and analysis progress
  const getFileStatus = useMemo(() => {
    const scopeFiles = systemHologram?.scope || [];
    const isComplete = auditStatus === 'secured' || auditStatus === 'issues';
    
    return (filePath: string): 'context' | 'pending' | 'analysed' => {
      const isInScope = scopeFiles.some(s => 
        s === filePath || filePath.endsWith(s) || s.endsWith(filePath)
      );
      
      if (!isInScope) {
        return 'context';
      }
      
      // If audit is complete, all in-scope files are analysed
      if (isComplete) {
        return 'analysed';
      }
      
      // Check if we have coverage results for this file
      const hasResults = coverageData?.details?.some(d => 
        d.file === filePath || filePath.includes(d.file) || d.file.includes(filePath)
      );
      
      // Check if any findings reference this file
      const hasFindings = findings.some(f => 
        f.location && (f.location.includes(filePath) || filePath.includes(f.location))
      );
      
      if (hasResults || hasFindings) {
        return 'analysed';
      }
      
      return 'pending';
    };
  }, [systemHologram?.scope, coverageData?.details, findings, auditStatus]);

  // Build the file tree from system_hologram data
  const fileTree = useMemo(() => {
    const allFiles = systemHologram?.all_files || [];
    const scopeFiles = systemHologram?.scope || [];
    
    if (allFiles.length === 0) {
      return [];
    }
    
    return buildFileTree(allFiles, scopeFiles, getFileStatus);
  }, [systemHologram?.all_files, systemHologram?.scope, getFileStatus]);

  // Count files by status
  const statusCounts = useMemo(() => {
    const allFiles = systemHologram?.all_files || [];
    const counts = { context: 0, pending: 0, analysed: 0 };
    
    allFiles.forEach(f => {
      const status = getFileStatus(f);
      counts[status]++;
    });
    
    return counts;
  }, [systemHologram?.all_files, getFileStatus]);

  const hasTreeData = fileTree.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="p-6 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <FileCode className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Audit Scope</h3>
            <p className="text-sm text-muted-foreground">
              Contracts and files included in this security audit
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{contractCount} Contracts</span>
          </div>
          {nlocCount !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{nlocCount.toLocaleString()} Lines of Code</span>
            </div>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Files in Scope
          </h4>
          {hasTreeData && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>{statusCounts.analysed} analysed</span>
              </div>
              {statusCounts.pending > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>{statusCounts.pending} analysing</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{statusCounts.context} context</span>
              </div>
            </div>
          )}
        </div>
        
        {hasTreeData ? (
          <div className="p-4 rounded-lg border border-border bg-card">
            {fileTree.map((node) => (
              <FileTreeNode key={node.path} node={node} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No contract scope data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeTab;
