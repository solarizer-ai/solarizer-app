import { useState, useEffect, useCallback } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFileExplorer,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { FileNode } from "@/types/files";
import {
  fileNodesToSandpackFiles,
  sandpackFilesToFileNodes,
  getFirstFilePath,
} from "@/lib/sandpackUtils";
import { solarizerDarkTheme, solarizerLightTheme } from "@/lib/sandpackTheme";

interface SandpackEditorProps {
  files?: FileNode[];
  onFilesChange?: (files: FileNode[]) => void;
  readOnly?: boolean;
  showExplorer?: boolean;
  disableAddFile?: boolean;
  height?: string;
}

// Inner component that has access to Sandpack context
const SandpackEditorInner = ({
  onFilesChange,
  readOnly = false,
  showExplorer = true,
  height = "500px",
}: Omit<SandpackEditorProps, "files">) => {
  const { sandpack } = useSandpack();
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync files back to parent when they change
  useEffect(() => {
    if (onFilesChange && sandpack.files) {
      const fileNodes = sandpackFilesToFileNodes(sandpack.files);
      onFilesChange(fileNodes);
    }
  }, [sandpack.files, onFilesChange]);

  const handleCopy = useCallback(async () => {
    const activeFile = sandpack.activeFile;
    const fileContent = sandpack.files[activeFile]?.code || "";
    await navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sandpack]);

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

  // Get current file language for display
  const activeFileName = sandpack.activeFile?.split("/").pop() || "";
  const getLanguageLabel = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    switch (ext) {
      case ".sol": return "SOL";
      case ".json": return "JSON";
      case ".md": return "MD";
      case ".js": case ".jsx": return "JS";
      case ".ts": case ".tsx": return "TS";
      case ".yaml": case ".yml": return "YAML";
      default: return "TXT";
    }
  };

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card",
        isFullscreen && "fixed top-16 left-0 right-0 bottom-0 z-[70] rounded-none border-0"
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground font-medium">
            {activeFileName || "No file selected"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded mr-2">
            {getLanguageLabel(activeFileName)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
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

      {/* Sandpack Layout */}
      <SandpackLayout
        style={{
          border: "none",
          borderRadius: 0,
          height: isFullscreen ? "calc(100vh - 112px)" : height,
        }}
      >
        {showExplorer && (
          <SandpackFileExplorer
            style={{
              height: isFullscreen ? "calc(100vh - 112px)" : height,
              minWidth: "180px",
              maxWidth: "250px",
            }}
          />
        )}
        <SandpackCodeEditor
          showTabs={true}
          showLineNumbers={true}
          showInlineErrors={true}
          wrapContent={true}
          closableTabs={true}
          readOnly={readOnly}
          style={{
            height: isFullscreen ? "calc(100vh - 112px)" : height,
            flex: 1,
          }}
        />
      </SandpackLayout>
    </div>
  );
};

// Main component that sets up the Sandpack provider
const SandpackEditor = ({
  files = [],
  onFilesChange,
  readOnly = false,
  showExplorer = true,
  disableAddFile = false,
  height = "500px",
}: SandpackEditorProps) => {
  const { theme } = useTheme();
  const [initialFiles] = useState(() => {
    const sandpackFiles = fileNodesToSandpackFiles(files);
    // Ensure at least one file exists
    if (Object.keys(sandpackFiles).length === 0) {
      return {
        "/Contract.sol": {
          code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyContract {
    // Your smart contract code here
}`,
          active: true,
        },
      };
    }
    return sandpackFiles;
  });

  const activeFile = getFirstFilePath(files) || Object.keys(initialFiles)[0];

  return (
    <SandpackProvider
      files={initialFiles}
      theme={theme === "dark" ? solarizerDarkTheme : solarizerLightTheme}
      options={{
        activeFile: activeFile?.startsWith("/") ? activeFile : `/${activeFile}`,
        visibleFiles: Object.keys(initialFiles),
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
      customSetup={{
        entry: activeFile?.startsWith("/") ? activeFile : `/${activeFile}`,
      }}
    >
      <SandpackEditorInner
        onFilesChange={onFilesChange}
        readOnly={readOnly}
        showExplorer={showExplorer}
        height={height}
      />
    </SandpackProvider>
  );
};

export default SandpackEditor;
