import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, Copy, Check, Maximize2, Minimize2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface FileTab {
  name: string;
  content: string;
}

interface CodeEditorProps {
  code: string;
  onChange?: (value: string) => void;
  fileName?: string;
  readOnly?: boolean;
  files?: FileTab[];
  onFilesChange?: (files: FileTab[]) => void;
}

const CodeEditor = ({ 
  code, 
  onChange, 
  fileName = "Contract.sol", 
  readOnly = false,
  files: externalFiles,
  onFilesChange 
}: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useTheme();
  
  // Use external files if provided, otherwise create single file from code prop
  const [internalFiles, setInternalFiles] = useState<FileTab[]>([
    { name: fileName, content: code }
  ]);
  
  const files = externalFiles || internalFiles;
  const setFiles = onFilesChange || setInternalFiles;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync single file mode with code prop
  useEffect(() => {
    if (!externalFiles && code !== internalFiles[activeTab]?.content) {
      setInternalFiles([{ name: fileName, content: code }]);
    }
  }, [code, fileName]);

  const handleCopy = async () => {
    const currentContent = files[activeTab]?.content || "";
    await navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newValue = value || "";
    const updatedFiles = [...files];
    updatedFiles[activeTab] = { ...updatedFiles[activeTab], content: newValue };
    setFiles(updatedFiles);
    onChange?.(newValue);
  };

  const addNewTab = () => {
    const newFileName = `Contract${files.length + 1}.sol`;
    setFiles([...files, { name: newFileName, content: "" }]);
    setActiveTab(files.length);
  };

  const closeTab = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

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

  const editorContent = (
    <div className={cn(
      "border border-border rounded-lg overflow-hidden bg-card",
      isFullscreen && "fixed inset-0 z-50 rounded-none border-0"
    )}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 mr-2">
          {files.map((file, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors shrink-0",
                activeTab === index
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="font-medium">{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => closeTab(index, e)}
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
              onClick={addNewTab}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded mr-2">
            Solidity
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
        isFullscreen ? "h-[calc(100vh-48px)]" : "h-[400px]"
      )}>
        {mounted && (
          <Editor
            height="100%"
            language="sol"
            value={files[activeTab]?.content || ""}
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