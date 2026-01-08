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
