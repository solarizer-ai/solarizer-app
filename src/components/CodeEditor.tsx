import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check, Maximize2, Minimize2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { FileNode, createFileNode, updateFileContent, toggleFolderExpanded, getAllFiles } from "@/types/files";
import FileExplorer from "./FileExplorer";
import FileTypeIcon from "./FileTypeIcon";

interface CodeEditorProps {
  code?: string;
  onChange?: (value: string) => void;
  fileName?: string;
  readOnly?: boolean;
  files?: FileNode[];
  onFilesChange?: (files: FileNode[]) => void;
  showExplorer?: boolean;
}

const CodeEditor = ({ 
  code = "", 
  onChange, 
  fileName = "Contract.sol", 
  readOnly = false,
  files: externalFiles,
  onFilesChange,
  showExplorer = false,
}: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const { theme } = useTheme();
  
  // Use external files if provided, otherwise create single file from code prop
  const [internalFiles, setInternalFiles] = useState<FileNode[]>([
    createFileNode(fileName, fileName, code)
  ]);
  
  const files = externalFiles || internalFiles;
  const setFiles = onFilesChange || setInternalFiles;

  // Get all file nodes for tabs
  const allFiles = getAllFiles(files);

  // Set initial active file
  useEffect(() => {
    if (allFiles.length > 0 && !activeFilePath) {
      setActiveFilePath(allFiles[0].path);
    }
  }, [allFiles, activeFilePath]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync single file mode with code prop
  useEffect(() => {
    if (!externalFiles && code !== internalFiles[0]?.content) {
      setInternalFiles([createFileNode(fileName, fileName, code)]);
    }
  }, [code, fileName, externalFiles]);

  const activeFile = allFiles.find(f => f.path === activeFilePath);
  const activeFileContent = activeFile?.content || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeFileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newValue = value || "";
    if (activeFilePath) {
      const updatedFiles = updateFileContent(files, activeFilePath, newValue);
      setFiles(updatedFiles);
    }
    onChange?.(newValue);
  };

  const handleFileSelect = (node: FileNode) => {
    setActiveFilePath(node.path);
  };

  const handleToggleFolder = (path: string) => {
    const updatedFiles = toggleFolderExpanded(files, path);
    setFiles(updatedFiles);
  };

  const addNewFile = () => {
    const newFileName = `Contract${allFiles.length + 1}.sol`;
    const newFile = createFileNode(newFileName, newFileName, "");
    setFiles([...files, newFile]);
    setActiveFilePath(newFileName);
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (allFiles.length <= 1) return;
    
    // Find the file to close and remove it
    const removeFile = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(n => n.path !== path)
        .map(n => n.children ? { ...n, children: removeFile(n.children) } : n);
    };
    
    const newFiles = removeFile(files);
    setFiles(newFiles);
    
    // Update active file if needed
    if (activeFilePath === path) {
      const remainingFiles = getAllFiles(newFiles);
      if (remainingFiles.length > 0) {
        setActiveFilePath(remainingFiles[0].path);
      }
    }
  };

  // Get open tabs (files that user has interacted with)
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  useEffect(() => {
    if (activeFilePath && !openTabs.includes(activeFilePath)) {
      setOpenTabs(prev => [...prev, activeFilePath]);
    }
  }, [activeFilePath]);

  // Filter to only show open tabs that still exist
  const visibleTabs = openTabs
    .map(path => allFiles.find(f => f.path === path))
    .filter(Boolean) as FileNode[];

  // If no tabs open yet, show first file
  useEffect(() => {
    if (visibleTabs.length === 0 && allFiles.length > 0) {
      setOpenTabs([allFiles[0].path]);
    }
  }, [allFiles, visibleTabs.length]);

  const editorOptions = {
    minimap: { enabled: isFullscreen },
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "'JetBrains Mono', monospace",
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    renderLineHighlight: "line" as const,
    cursorBlinking: "smooth" as const,
    smoothScrolling: true,
    readOnly,
    wordWrap: "on" as const,
    lineNumbers: "on" as const,
    folding: true,
    bracketPairColorization: { enabled: true },
  };

  const getLanguage = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    switch (ext) {
      case '.sol': return 'sol';
      case '.json': return 'json';
      case '.md': return 'markdown';
      case '.js': case '.jsx': return 'javascript';
      case '.ts': case '.tsx': return 'typescript';
      case '.yaml': case '.yml': return 'yaml';
      default: return 'plaintext';
    }
  };

  const editorContent = (
    <div className={cn(
      "border border-border rounded-lg overflow-hidden bg-card flex",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-0"
    )}>
      {/* File Explorer */}
      {showExplorer && (
        <FileExplorer
          files={files}
          onFilesChange={setFiles}
          activeFilePath={activeFilePath}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          isCollapsed={explorerCollapsed}
          onToggleCollapse={() => setExplorerCollapsed(!explorerCollapsed)}
        />
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1 overflow-x-auto flex-1 mr-2">
            {visibleTabs.map((file) => (
              <button
                key={file.path}
                onClick={() => setActiveFilePath(file.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors shrink-0",
                  activeFilePath === file.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FileTypeIcon fileName={file.name} size={14} />
                <span className="font-medium">{file.name}</span>
                {visibleTabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(file.path, e)}
                    className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={addNewFile}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded mr-2">
              {activeFile ? getLanguage(activeFile.name).toUpperCase() : 'SOL'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className={cn(
          !mounted && "bg-muted animate-pulse",
          isFullscreen ? "h-[calc(100vh-48px)]" : "h-[500px]"
        )}>
          {mounted && (
            <Editor
              height="100%"
              language={activeFile ? getLanguage(activeFile.name) : 'sol'}
              value={activeFileContent}
              onChange={handleCodeChange}
              theme={theme === "dark" ? "enx-dark" : "enx-light"}
              options={editorOptions}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("enx-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "keyword", foreground: "3b82f6" },
                    { token: "string", foreground: "22c55e" },
                    { token: "number", foreground: "f59e0b" },
                    { token: "comment", foreground: "6b7280" },
                  ],
                  colors: {
                    "editor.background": "#0c0f14",
                    "editor.foreground": "#ffffff",
                    "editor.lineHighlightBackground": "#1e293b",
                    "editorLineNumber.foreground": "#4b5563",
                    "editorLineNumber.activeForeground": "#9ca3af",
                    "editor.selectionBackground": "#3b82f640",
                  },
                });
                monaco.editor.defineTheme("enx-light", {
                  base: "vs",
                  inherit: true,
                  rules: [
                    { token: "keyword", foreground: "2563eb" },
                    { token: "string", foreground: "16a34a" },
                    { token: "number", foreground: "d97706" },
                    { token: "comment", foreground: "9ca3af" },
                  ],
                  colors: {
                    "editor.background": "#fafafa",
                    "editor.foreground": "#1e293b",
                    "editor.lineHighlightBackground": "#f1f5f9",
                    "editorLineNumber.foreground": "#94a3b8",
                    "editorLineNumber.activeForeground": "#475569",
                    "editor.selectionBackground": "#3b82f640",
                  },
                });
              }}
              onMount={(editor, monaco) => {
                monaco.editor.setTheme(theme === "dark" ? "enx-dark" : "enx-light");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  // Handle ESC key for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return editorContent;
};

export default CodeEditor;
