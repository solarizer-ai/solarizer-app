import { FileNode, generateId } from "@/types/files";
import { invokeWithRefresh } from "@/lib/sessionRefresh";

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

/**
 * Parse a GitHub URL to extract owner, repo, branch, and path
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/path/to/folder
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname !== 'github.com') {
      return null;
    }

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      return null;
    }

    const [owner, repo, ...rest] = pathParts;
    
    // Clean repo name (remove .git if present)
    const cleanRepo = repo.replace(/\.git$/, '');
    
    if (rest.length === 0) {
      return { owner, repo: cleanRepo };
    }

    // Check for /tree/branch/path format
    if (rest[0] === 'tree' && rest.length >= 2) {
      const branch = rest[1];
      const path = rest.slice(2).join('/');
      return { owner, repo: cleanRepo, branch, path: path || undefined };
    }

    // Check for /blob/branch/path format (file URL)
    if (rest[0] === 'blob' && rest.length >= 2) {
      const branch = rest[1];
      const path = rest.slice(2, -1).join('/'); // Exclude filename
      return { owner, repo: cleanRepo, branch, path: path || undefined };
    }

    return { owner, repo: cleanRepo };
  } catch {
    return null;
  }
}

/**
 * Validate if a string is a valid GitHub URL
 */
export function isValidGitHubUrl(url: string): boolean {
  return parseGitHubUrl(url) !== null;
}

interface FetchRepoResponse {
  success: boolean;
  files?: Array<{ name: string; path: string; content: string }>;
  branches?: string[];
  error?: string;
}

/**
 * Fetch repository contents via edge function
 */
export async function fetchRepoContents(
  repoUrl: string,
  branch?: string,
  path?: string
): Promise<FileNode[]> {
  const { data, error } = await invokeWithRefresh<FetchRepoResponse>('github-fetch-repo', {
    body: { repo_url: repoUrl, branch, path },
  });

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to fetch repository');
  }

  return buildFileNodesFromFiles(data.files || []);
}

/**
 * Build FileNode tree from flat file list
 */
function buildFileNodesFromFiles(files: Array<{ name: string; path: string; content: string }>): FileNode[] {
  const tree: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  for (const file of files) {
    const pathParts = file.path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Build folder structure
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
    const fileNode: FileNode = {
      id: generateId(),
      name: fileName,
      path: file.path,
      type: 'file',
      content: file.content,
    };
    parentChildren.push(fileNode);
  }

  return tree;
}

/**
 * Fetch available branches for a repository
 */
export async function fetchRepoBranches(owner: string, repo: string): Promise<string[]> {
  const { data, error } = await invokeWithRefresh<FetchRepoResponse>('github-fetch-repo', {
    body: { 
      repo_url: `https://github.com/${owner}/${repo}`,
      list_branches: true 
    },
  });

  if (error) {
    console.error('Failed to fetch branches:', error);
    return ['main', 'master']; // Fallback
  }

  return data?.branches || ['main', 'master'];
}
