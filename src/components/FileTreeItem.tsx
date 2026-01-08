import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode } from "@/types/files";
import FileTypeIcon from "./FileTypeIcon";

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  activeFilePath: string | null;
  onFileSelect: (node: FileNode) => void;
  onToggleFolder: (path: string) => void;
}

const FileTreeItem = ({
  node,
  depth,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
}: FileTreeItemProps) => {
  const isActive = node.path === activeFilePath;
  const isFolder = node.type === 'folder';
  const isExpanded = node.isExpanded ?? false;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.path);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded-md transition-colors text-left",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
        <span className="truncate">{node.name}</span>
      </button>

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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeItem;
