import { FileNode, createFileNode, createFolderNode, getAllFiles } from "@/types/files";

export interface SandpackFiles {
  [path: string]: {
    code: string;
    active?: boolean;
    hidden?: boolean;
    readOnly?: boolean;
  };
}

/**
 * Convert FileNode[] to Sandpack file format
 */
export const fileNodesToSandpackFiles = (
  nodes: FileNode[],
  activeFilePath?: string | null
): SandpackFiles => {
  const sandpackFiles: SandpackFiles = {};
  const allFiles = getAllFiles(nodes);

  allFiles.forEach((file) => {
    // Sandpack requires paths to start with /
    const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
    sandpackFiles[path] = {
      code: file.content || "",
      active: file.path === activeFilePath,
    };
  });

  return sandpackFiles;
};

/**
 * Convert Sandpack files back to FileNode[]
 */
export const sandpackFilesToFileNodes = (
  sandpackFiles: Record<string, { code: string }>
): FileNode[] => {
  const nodes: FileNode[] = [];
  const folderPaths = new Set<string>();

  // Sort paths to ensure parent folders are created first
  const paths = Object.keys(sandpackFiles).sort();

  paths.forEach((path) => {
    // Remove leading slash
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const parts = normalizedPath.split("/");
    const fileName = parts[parts.length - 1];
    
    // Create intermediate folders
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      
      if (!folderPaths.has(currentPath)) {
        folderPaths.add(currentPath);
        insertFolderInTree(nodes, currentPath, folderName);
      }
    }

    // Create the file
    const file = createFileNode(fileName, normalizedPath, sandpackFiles[path].code);
    
    if (parts.length === 1) {
      // Root level file
      nodes.push(file);
    } else {
      // Nested file - add to parent folder
      const parentPath = parts.slice(0, -1).join("/");
      insertFileInFolder(nodes, parentPath, file);
    }
  });

  return nodes;
};

/**
 * Helper to insert a folder into the tree
 */
const insertFolderInTree = (nodes: FileNode[], folderPath: string, folderName: string) => {
  const parts = folderPath.split("/");
  
  if (parts.length === 1) {
    // Root level folder
    if (!nodes.find(n => n.path === folderPath)) {
      nodes.push(createFolderNode(folderName, folderPath, []));
    }
    return;
  }

  // Find parent and add folder
  const parentPath = parts.slice(0, -1).join("/");
  const parent = findFolderByPath(nodes, parentPath);
  
  if (parent && parent.children) {
    if (!parent.children.find(n => n.path === folderPath)) {
      parent.children.push(createFolderNode(folderName, folderPath, []));
    }
  }
};

/**
 * Helper to insert a file into a folder
 */
const insertFileInFolder = (nodes: FileNode[], folderPath: string, file: FileNode) => {
  const folder = findFolderByPath(nodes, folderPath);
  if (folder && folder.children) {
    folder.children.push(file);
  }
};

/**
 * Helper to find a folder by path
 */
const findFolderByPath = (nodes: FileNode[], path: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path && node.type === "folder") {
      return node;
    }
    if (node.children) {
      const found = findFolderByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get the active file path from FileNode array
 */
export const getFirstFilePath = (nodes: FileNode[]): string | null => {
  const allFiles = getAllFiles(nodes);
  return allFiles.length > 0 ? allFiles[0].path : null;
};
