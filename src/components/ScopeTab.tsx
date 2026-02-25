import { useState, useMemo, useEffect } from "react";
import { FileCode, FileText, FolderOpen, Folder, Info, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react";
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
  scopeMetadata?: unknown;
  contextMetadata?: unknown;
  orchestrationScopeFiles?: unknown;
  orchestrationContextFiles?: unknown;
}

/**
 * Normalize unknown input into a deduplicated array of file path strings.
 * Handles: null, undefined, string[], object[], JSON-string, single object.
 */
function normalizePaths(data: unknown): string[] {
  if (!data) return [];

  // If it's a JSON string, parse it first
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return normalizePaths(parsed);
    } catch {
      const trimmed = data.trim();
      return trimmed ? [trimmed] : [];
    }
  }

  if (Array.isArray(data)) {
    const paths: string[] = [];
    for (const item of data) {
      if (typeof item === 'string') {
        const t = item.trim();
        if (t) paths.push(t);
      } else if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const p = obj.path ?? obj.file ?? obj.filePath ?? obj.filename;
        if (typeof p === 'string') {
          const t = p.trim();
          if (t) paths.push(t);
        }
      }
    }
    return Array.from(new Set(paths));
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const p = obj.path ?? obj.file ?? obj.filePath ?? obj.filename;
    if (typeof p === 'string') {
      const t = p.trim();
      return t ? [t] : [];
    }
  }

  return [];
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

interface FileTreeNodeProps {
  node: TreeNode;
  depth?: number;
  expandedFolders: Set<string>;
  onToggleExpand: (path: string) => void;
}

const FileTreeNode = ({ node, depth = 0, expandedFolders, onToggleExpand }: FileTreeNodeProps) => {
  const paddingLeft = depth * 16;
  
  if (!node.isFile) {
    const isExpanded = expandedFolders.has(node.path);
    
    return (
      <div>
        <div 
          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors cursor-pointer select-none"
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onToggleExpand(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-primary/70 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-primary/70 shrink-0" />
          )}
          <span className="text-sm font-medium text-foreground">{node.name}</span>
          <span className="text-xs text-muted-foreground">
            ({node.children.length})
          </span>
        </div>
        {isExpanded && node.children.map((child) => (
          <FileTreeNode 
            key={child.path} 
            node={child} 
            depth={depth + 1}
            expandedFolders={expandedFolders}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div 
      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
      style={{ paddingLeft: `${paddingLeft + 20}px` }}
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
  scopeMetadata,
  contextMetadata,
  orchestrationScopeFiles,
  orchestrationContextFiles,
}: ScopeTabProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set());

  // Derive scope and all files with multi-source fallback + normalization
  const { derivedScopeFiles, derivedAllFiles } = useMemo(() => {
    // Source 1: system_hologram
    const holoScope = normalizePaths(systemHologram?.scope);
    const holoAll = normalizePaths(systemHologram?.all_files);

    // Source 2: audit row metadata
    const metaScope = normalizePaths(scopeMetadata);
    const metaContext = normalizePaths(contextMetadata);

    // Source 3: orchestration payload
    const orchScope = normalizePaths(orchestrationScopeFiles);
    const orchContext = normalizePaths(orchestrationContextFiles);

    // Pick scope files by precedence
    const scopeFiles = holoScope.length > 0
      ? holoScope
      : metaScope.length > 0
        ? metaScope
        : orchScope;

    // Pick context files
    const contextFiles = metaContext.length > 0 ? metaContext : orchContext;

    // Pick all files
    const allFiles = holoAll.length > 0
      ? holoAll
      : Array.from(new Set([...scopeFiles, ...contextFiles]));

    if (import.meta.env.DEV && allFiles.length === 0) {
      console.debug('[ScopeTab] All sources empty', {
        holoScope: holoScope.length, metaScope: metaScope.length, orchScope: orchScope.length,
      });
    }

    return { derivedScopeFiles: scopeFiles, derivedAllFiles: allFiles };
  }, [systemHologram?.scope, systemHologram?.all_files, scopeMetadata, contextMetadata, orchestrationScopeFiles, orchestrationContextFiles]);

  // Determine file status based on scope and analysis progress
  const getFileStatus = useMemo(() => {
    const isComplete = auditStatus === 'secured' || auditStatus === 'issues';
    const scopeSet = new Set(derivedScopeFiles);
    
    return (filePath: string): 'context' | 'pending' | 'analysed' => {
      // Check if file is in scope using exact match or suffix matching
      const isInScope = scopeSet.has(filePath) || derivedScopeFiles.some(s => 
        s && filePath && (filePath.endsWith(s) || s.endsWith(filePath))
      );
      
      if (!isInScope) return 'context';
      if (isComplete) return 'analysed';
      
      const hasResults = coverageData?.details?.some(d => 
        d?.file && filePath && (d.file === filePath || filePath.includes(d.file) || d.file.includes(filePath))
      );
      
      const hasFindings = findings.some(f => 
        f?.location && filePath && (f.location.includes(filePath) || filePath.includes(f.location))
      );
      
      return (hasResults || hasFindings) ? 'analysed' : 'pending';
    };
  }, [derivedScopeFiles, coverageData?.details, findings, auditStatus]);

  // Build the file tree
  const fileTree = useMemo(() => {
    if (derivedAllFiles.length === 0) return [];
    return buildFileTree(derivedAllFiles, derivedScopeFiles, getFileStatus);
  }, [derivedAllFiles, derivedScopeFiles, getFileStatus]);

  // Auto-expand root folders (useEffect instead of useMemo for side effects)
  useEffect(() => {
    if (fileTree.length > 0 && expandedFolders.size === 0) {
      const rootFolders = fileTree.filter(n => !n.isFile).map(n => n.path);
      if (rootFolders.length > 0) {
        setExpandedFolders(new Set(rootFolders));
      }
    }
  }, [fileTree]);

  // Count files by status
  const statusCounts = useMemo(() => {
    const counts = { context: 0, pending: 0, analysed: 0 };
    derivedAllFiles.forEach(f => {
      counts[getFileStatus(f)]++;
    });
    return counts;
  }, [derivedAllFiles, getFileStatus]);

  const hasTreeData = fileTree.length > 0;

  // Resilient contract count
  const displayContractCount = contractCount > 0
    ? contractCount
    : derivedScopeFiles.length > 0
      ? derivedScopeFiles.length
      : 0;

  const handleToggleExpand = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

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
            <span className="text-sm font-medium text-foreground">{displayContractCount} Contracts</span>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
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
              <FileTreeNode 
                key={node.path} 
                node={node}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleExpand}
              />
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
