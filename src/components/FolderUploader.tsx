import { useState, useCallback, useRef } from "react";
import { FolderUp, Loader2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileNode, generateId } from "@/types/files";
import FileTypeIcon from "./FileTypeIcon";

interface FolderUploaderProps {
  onFilesUploaded: (files: FileNode[]) => void;
  uploadedFiles: FileNode[];
  onClear: () => void;
}

const ALLOWED_EXTENSIONS = ['.sol', '.json', '.md', '.txt', '.js', '.ts', '.yaml', '.yml', '.toml'];

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FolderUploader = ({ onFilesUploaded, uploadedFiles, onClear }: FolderUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldIncludeFile = (name: string): boolean => {
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext);
  };

  const buildTreeFromFiles = async (files: File[]): Promise<FileNode[]> => {
    const tree: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();
    
    let processed = 0;
    const total = files.length;

    for (const file of files) {
      const relativePath = (file as any).webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      
      // Skip the root folder name from webkitRelativePath
      const pathParts = parts.length > 1 ? parts.slice(1) : parts;
      const fileName = pathParts[pathParts.length - 1];
      
      // Skip lib and node_modules folders
      const shouldSkipFolder = pathParts.some(part => 
        part === 'lib' || part === 'node_modules'
      );
      
      if (shouldSkipFolder || !shouldIncludeFile(fileName)) {
        processed++;
        setProgress(Math.round((processed / total) * 100));
        continue;
      }

      // Read file content
      const content = await file.text();
      
      // Build path and create folders as needed
      let currentPath = '';
      let parentChildren = tree;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        if (!folderMap.has(currentPath)) {
          const folderNode: FileNode = {
            id: generateId(),
            name: folderName,
            path: currentPath,
            type: 'folder',
            children: [],
            isExpanded: true,
          };
          folderMap.set(currentPath, folderNode);
          parentChildren.push(folderNode);
        }
        parentChildren = folderMap.get(currentPath)!.children!;
      }

      // Add file node
      const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const fileNode: FileNode = {
        id: generateId(),
        name: fileName,
        path: filePath,
        type: 'file',
        content,
      };
      parentChildren.push(fileNode);

      processed++;
      setProgress(Math.round((processed / total) * 100));
    }

    return tree;
  };

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    setProgress(0);

    try {
      const tree = await buildTreeFromFiles(files);
      onFilesUploaded(tree);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await processFiles(files);
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  const traverseEntry = async (entry: FileSystemEntry): Promise<File[]> => {
    const files: File[] = [];

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve) => {
        fileEntry.file(resolve);
      });
      // Add webkitRelativePath manually for drag & drop
      Object.defineProperty(file, 'webkitRelativePath', {
        value: entry.fullPath.substring(1), // Remove leading slash
        writable: false,
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(resolve);
      });
      for (const childEntry of entries) {
        const childFiles = await traverseEntry(childEntry);
        files.push(...childFiles);
      }
    }

    return files;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        const entryFiles = await traverseEntry(entry);
        files.push(...entryFiles);
      }
    }

    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const countFiles = (nodes: FileNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.type === 'file') count++;
      if (node.children) count += countFiles(node.children);
    }
    return count;
  };

  const getTotalSize = (nodes: FileNode[]): number => {
    let size = 0;
    for (const node of nodes) {
      if (node.type === 'file' && node.content) {
        size += new Blob([node.content]).size;
      }
      if (node.children) size += getTotalSize(node.children);
    }
    return size;
  };

  const renderTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <FileTypeIcon
            fileName={node.name}
            isFolder={node.type === 'folder'}
            isOpen={true}
            size={14}
          />
          <span className="truncate">{node.name}</span>
          {node.type === 'file' && node.content && (
            <span className="text-xs text-muted-foreground/60 ml-auto">
              {formatSize(new Blob([node.content]).size)}
            </span>
          )}
        </div>
        {node.children && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  if (uploadedFiles.length > 0) {
    const fileCount = countFiles(uploadedFiles);
    const totalSize = getTotalSize(uploadedFiles);

    return (
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FolderUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {fileCount} files uploaded
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSize(totalSize)} total
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
        <div className="max-h-48 overflow-y-auto border border-border rounded-md p-2 bg-muted/30">
          {renderTree(uploadedFiles)}
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in React types
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Processing files...</p>
            <p className="text-xs text-muted-foreground">{progress}% complete</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center">
            <Upload className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Drag & drop your src/contracts folder
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse • Skips lib and node_modules
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderUploader;
