import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, Copy, Check, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  code: string;
  onChange?: (value: string) => void;
  fileName?: string;
  readOnly?: boolean;
}

const CodeEditor = ({ code, onChange, fileName = "Contract.sol", readOnly = false }: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const editorOptions = {
    minimap: { enabled: false },
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

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{fileName}</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            Solidity
          </span>
        </div>
        <div className="flex items-center gap-1">
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
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className={cn("h-[400px]", !mounted && "bg-muted animate-pulse")}>
        {mounted && (
          <Editor
            height="100%"
            language="sol"
            value={code}
            onChange={(value) => onChange?.(value || "")}
            theme="vs-dark"
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
            }}
            onMount={(editor, monaco) => {
              monaco.editor.setTheme("enx-dark");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
