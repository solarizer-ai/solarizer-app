import { useState } from "react";
import { FilePlus, FolderPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileNode, createFileNode, createFolderNode, addNodeToTree, deleteNodeFromTree, moveNodeInTree, isDescendantOf, renameNodeInTree, findNodeByPath } from "@/types/files";
import FileTreeItem from "./FileTreeItem";

interface FileExplorerProps {
  files: FileNode[];
  onFilesChange: (files: FileNode[]) => void;
  activeFilePath: string | null;
  onFileSelect: (node: FileNode) => void;
  onToggleFolder: (path: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FileExplorer = ({
  files,
  onFilesChange,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
  isCollapsed = false,
  onToggleCollapse,
}: FileExplorerProps) => {
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [creatingInPath, setCreatingInPath] = useState<string>("");
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      resetCreatingState();
      return;
    }

    const name = newItemName.trim();
    const path = creatingInPath ? `${creatingInPath}/${name}` : name;

    if (isCreating === 'file') {
      const newFile = createFileNode(name, path, '');
      onFilesChange(addNodeToTree(files, creatingInPath, newFile));
    } else if (isCreating === 'folder') {
      const newFolder = createFolderNode(name, path, []);
      onFilesChange(addNodeToTree(files, creatingInPath, newFolder));
    }

    resetCreatingState();
  };

  const resetCreatingState = () => {
    setNewItemName("");
    setIsCreating(null);
    setCreatingInPath("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateItem();
    } else if (e.key === 'Escape') {
      resetCreatingState();
    }
  };

  const handleCreateInFolder = (folderPath: string, type: 'file' | 'folder') => {
    setCreatingInPath(folderPath);
    setIsCreating(type);
    setNewItemName("");
  };

  const handleRootCreate = (type: 'file' | 'folder') => {
    setCreatingInPath("");
    setIsCreating(type);
    setNewItemName("");
  };

  const handleDelete = (path: string) => {
    const newFiles = deleteNodeFromTree(files, path);
    onFilesChange(newFiles);
  };

  const handleRename = (oldPath: string, newName: string) => {
    const node = findNodeByPath(files, oldPath);
    if (!newName.trim() || newName === node?.name) {
      setRenamingPath(null);
      return;
    }
    const newFiles = renameNodeInTree(files, oldPath, newName.trim());
    onFilesChange(newFiles);
    setRenamingPath(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, path: string) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingPath(path);
  };

  const handleDragOver = (e: React.DragEvent, path: string) => {
    e.preventDefault();
    // Only allow dropping on folders, and not on self or descendants
    if (draggingPath && !isDescendantOf(path, draggingPath)) {
      setDragOverPath(path);
    }
  };

  const handleDragLeave = () => {
    setDragOverPath(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    const sourcePath = e.dataTransfer.getData('text/plain');
    
    if (sourcePath && sourcePath !== targetPath) {
      const newFiles = moveNodeInTree(files, sourcePath, targetPath);
      onFilesChange(newFiles);
    }
    
    setDragOverPath(null);
    setDraggingPath(null);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourcePath = e.dataTransfer.getData('text/plain');
    
    if (sourcePath) {
      // Move to root (empty string as target)
      const newFiles = moveNodeInTree(files, sourcePath, '');
      onFilesChange(newFiles);
    }
    
    setDragOverPath(null);
    setDraggingPath(null);
  };

  if (isCollapsed) {
    return (
      <div className="h-full border-r border-border bg-card flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onToggleCollapse}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Check if we're creating at root level (not inside a folder)
  const isCreatingAtRoot = isCreating && creatingInPath === "";

  return (
    <div className="h-full w-56 border-r border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => handleRootCreate('file')}
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => handleRootCreate('folder')}
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            title="Collapse"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div 
          className="p-1"
          onDragOver={(e) => { e.preventDefault(); setDragOverPath('__root__'); }}
          onDragLeave={() => setDragOverPath(null)}
          onDrop={handleRootDrop}
        >
          {/* New item input at root level */}
          {isCreatingAtRoot && (
            <div className="px-2 py-1">
              <Input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={handleCreateItem}
                onKeyDown={handleKeyDown}
                placeholder={isCreating === 'file' ? 'filename.sol' : 'folder-name'}
                className="h-7 text-sm"
              />
            </div>
          )}

          {/* Tree items */}
          {files.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              depth={0}
              activeFilePath={activeFilePath}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
              onCreateInFolder={handleCreateInFolder}
              onDelete={handleDelete}
              creatingInPath={creatingInPath}
              isCreating={isCreating}
              newItemName={newItemName}
              onNewItemNameChange={setNewItemName}
              onCreateConfirm={handleCreateItem}
              onCreateCancel={resetCreatingState}
              dragOverPath={dragOverPath}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              renamingPath={renamingPath}
              onStartRename={setRenamingPath}
              onRename={handleRename}
              onCancelRename={() => setRenamingPath(null)}
            />
          ))}

          {files.length === 0 && !isCreating && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No files yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileExplorer;
