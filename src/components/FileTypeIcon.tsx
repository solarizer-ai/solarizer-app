import { FileCode, FileText, File, Braces, Settings, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTypeIconProps {
  fileName: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
  size?: number;
}

const FILE_TYPE_CONFIG: Record<string, { icon: typeof File; colorClass: string }> = {
  '.sol': { icon: FileCode, colorClass: 'text-purple-500' },
  '.rs': { icon: FileCode, colorClass: 'text-orange-500' },
  '.json': { icon: Braces, colorClass: 'text-yellow-500' },
  '.md': { icon: FileText, colorClass: 'text-blue-500' },
  '.txt': { icon: FileText, colorClass: 'text-muted-foreground' },
  '.js': { icon: FileCode, colorClass: 'text-amber-500' },
  '.jsx': { icon: FileCode, colorClass: 'text-amber-500' },
  '.ts': { icon: FileCode, colorClass: 'text-blue-600' },
  '.tsx': { icon: FileCode, colorClass: 'text-blue-600' },
  '.yaml': { icon: Settings, colorClass: 'text-red-500' },
  '.yml': { icon: Settings, colorClass: 'text-red-500' },
  '.toml': { icon: Settings, colorClass: 'text-orange-500' },
  '.css': { icon: FileCode, colorClass: 'text-pink-500' },
  '.scss': { icon: FileCode, colorClass: 'text-pink-500' },
  '.html': { icon: FileCode, colorClass: 'text-orange-600' },
};

const FileTypeIcon = ({ fileName, isFolder = false, isOpen = false, className, size = 16 }: FileTypeIconProps) => {
  if (isFolder) {
    const Icon = isOpen ? FolderOpen : Folder;
    return <Icon className={cn("text-amber-500", className)} size={size} />;
  }
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const config = FILE_TYPE_CONFIG[extension] || { icon: File, colorClass: 'text-muted-foreground' };
  const Icon = config.icon;
  return <Icon className={cn(config.colorClass, className)} size={size} />;
};

export default FileTypeIcon;
