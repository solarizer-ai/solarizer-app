import { ChevronRight, ChevronDown, FilePlus, FolderPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode } from "@/types/files";
import FileTypeIcon from "./FileTypeIcon";
import { Input } from "./ui/input";

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onFileSelect: (node: FileNode) => void;
  onToggleFolder: (path: string) => void;
  onCreateInFolder?: (folderPath: string, type: 'file' | 'folder') => void;
  onDelete?: (path: string) => void;
  creatingInPath?: string;
  isCreating?: 'file' | 'folder' | null;
  newItemName?: string;
  onNewItemNameChange?: (name: string) => void;
  onCreateConfirm?: () => void;
  onCreateCancel?: () => void;
  // Drag and drop
  dragOverPath?: string | null;
  onDragStart?: (e: React.DragEvent, path: string) => void;
  onDragOver?: (e: React.DragEvent, path: string) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPath: string) => void;
}

const FileTreeItem = ({
  node,
  depth,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
  onCreateInFolder,
  onDelete,
  creatingInPath,
  isCreating,
  newItemName,
  onNewItemNameChange,
  onCreateConfirm,
  onCreateCancel,
  dragOverPath,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileTreeItemProps) => {
  const isActive = node.path === activeFilePath;
  const isFolder = node.type === 'folder';
  const isExpanded = node.isExpanded ?? false;
  const isCreatingHere = isCreating && creatingInPath === node.path;
  const isDragOver = dragOverPath === node.path && isFolder;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.path);
    } else {
      onFileSelect(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onCreateConfirm?.();
    } else if (e.key === 'Escape') {
      onCreateCancel?.();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart?.(e, node.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder) {
      onDragOver?.(e, node.path);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragLeave?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder) {
      onDrop?.(e, node.path);
    }
  };

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded-md transition-colors text-left cursor-pointer select-none",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          isDragOver && "bg-primary/20 ring-1 ring-primary/40"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder && (
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-4 shrink-0" />}
        <FileTypeIcon
          fileName={node.name}
          isFolder={isFolder}
          isOpen={isExpanded}
          size={14}
          className="shrink-0"
        />
        <span className="truncate flex-1">{node.name}</span>
        
        {/* Action buttons on hover */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFolder && onCreateInFolder && (
            <>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onCreateInFolder(node.path, 'file'); }}
                className="p-0.5 hover:bg-muted rounded"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onCreateInFolder(node.path, 'folder'); }}
                className="p-0.5 hover:bg-muted rounded"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </span>
            </>
          )}
          {onDelete && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onDelete(node.path); }}
              className="p-0.5 hover:bg-destructive/20 hover:text-destructive rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Inline input for creating new item inside this folder */}
      {isFolder && isCreatingHere && (
        <div 
          className="flex items-center gap-1.5 px-2 py-1"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          <span className="w-4 shrink-0" />
          <FileTypeIcon
            fileName={isCreating === 'folder' ? 'folder' : newItemName || 'file'}
            isFolder={isCreating === 'folder'}
            size={14}
            className="shrink-0"
          />
          <Input
            autoFocus
            value={newItemName}
            onChange={(e) => onNewItemNameChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onCreateCancel}
            placeholder={isCreating === 'file' ? 'filename.sol' : 'folder name'}
            className="h-6 text-sm py-0 px-1.5"
          />
        </div>
      )}

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
              onCreateInFolder={onCreateInFolder}
              onDelete={onDelete}
              creatingInPath={creatingInPath}
              isCreating={isCreating}
              newItemName={newItemName}
              onNewItemNameChange={onNewItemNameChange}
              onCreateConfirm={onCreateConfirm}
              onCreateCancel={onCreateCancel}
              dragOverPath={dragOverPath}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeItem;
