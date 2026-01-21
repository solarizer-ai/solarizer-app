export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const createFileNode = (
  name: string,
  path: string,
  content: string = ''
): FileNode => ({
  id: generateId(),
  name,
  path,
  type: 'file',
  content,
});

export const createFolderNode = (
  name: string,
  path: string,
  children: FileNode[] = []
): FileNode => ({
  id: generateId(),
  name,
  path,
  type: 'folder',
  children,
  isExpanded: true,
});

export const findNodeByPath = (
  nodes: FileNode[],
  path: string
): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export const updateFileContent = (
  nodes: FileNode[],
  path: string,
  content: string
): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === path && node.type === 'file') {
      return { ...node, content };
    }
    if (node.children) {
      return { ...node, children: updateFileContent(node.children, path, content) };
    }
    return node;
  });
};

export const toggleFolderExpanded = (
  nodes: FileNode[],
  path: string
): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === path && node.type === 'folder') {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children) {
      return { ...node, children: toggleFolderExpanded(node.children, path) };
    }
    return node;
  });
};

export const addNodeToTree = (
  nodes: FileNode[],
  parentPath: string,
  newNode: FileNode
): FileNode[] => {
  if (parentPath === '') {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.path === parentPath && node.type === 'folder') {
      return { ...node, children: [...(node.children || []), newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeToTree(node.children, parentPath, newNode) };
    }
    return node;
  });
};

export const deleteNodeFromTree = (
  nodes: FileNode[],
  path: string
): FileNode[] => {
  return nodes
    .filter((node) => node.path !== path)
    .map((node) => {
      if (node.children) {
        return { ...node, children: deleteNodeFromTree(node.children, path) };
      }
      return node;
    });
};

export const renameNodeInTree = (
  nodes: FileNode[],
  oldPath: string,
  newName: string
): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === oldPath) {
      const pathParts = oldPath.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');
      
      return updateNodePaths({ ...node, name: newName }, newPath);
    }
    if (node.children) {
      return { ...node, children: renameNodeInTree(node.children, oldPath, newName) };
    }
    return node;
  });
};

export const getAllFiles = (nodes: FileNode[]): FileNode[] => {
  const files: FileNode[] = [];
  const traverse = (nodeList: FileNode[]) => {
    for (const node of nodeList) {
      if (node.type === 'file') {
        files.push(node);
      } else if (node.children) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return files;
};

// Helper to update paths recursively for a node and its children
const updateNodePaths = (node: FileNode, newPath: string): FileNode => {
  const updatedNode = { ...node, path: newPath };
  if (node.type === 'folder' && node.children) {
    updatedNode.children = node.children.map((child) => {
      const childNewPath = `${newPath}/${child.name}`;
      return updateNodePaths(child, childNewPath);
    });
  }
  return updatedNode;
};

// Check if targetPath is inside sourcePath (to prevent dropping into self)
export const isDescendantOf = (targetPath: string, sourcePath: string): boolean => {
  return targetPath === sourcePath || targetPath.startsWith(sourcePath + '/');
};

export const moveNodeInTree = (
  nodes: FileNode[],
  sourcePath: string,
  targetFolderPath: string
): FileNode[] => {
  // Find the source node
  const sourceNode = findNodeByPath(nodes, sourcePath);
  if (!sourceNode) return nodes;

  // Prevent moving into self or descendants
  if (isDescendantOf(targetFolderPath, sourcePath)) return nodes;

  // Remove from original location
  let newTree = deleteNodeFromTree(nodes, sourcePath);

  // Update the path of the moved node and its children
  const newPath = targetFolderPath ? `${targetFolderPath}/${sourceNode.name}` : sourceNode.name;
  const updatedNode = updateNodePaths(sourceNode, newPath);

  // Add to new location
  return addNodeToTree(newTree, targetFolderPath, updatedNode);
};

/**
 * Merge two file trees, combining folders and replacing files with same path
 * Used for "Add More Files" functionality
 */
export const mergeFileTrees = (
  existing: FileNode[],
  incoming: FileNode[]
): FileNode[] => {
  const merged = [...existing];

  for (const incomingNode of incoming) {
    const existingIndex = merged.findIndex(n => n.path === incomingNode.path);

    if (existingIndex === -1) {
      // New path - add to tree
      merged.push(incomingNode);
    } else if (incomingNode.type === 'file') {
      // Existing file - replace content
      merged[existingIndex] = incomingNode;
    } else if (incomingNode.type === 'folder' && incomingNode.children) {
      // Existing folder - recursively merge children
      merged[existingIndex] = {
        ...merged[existingIndex],
        children: mergeFileTrees(merged[existingIndex].children || [], incomingNode.children),
      };
    }
  }

  return merged;
};
