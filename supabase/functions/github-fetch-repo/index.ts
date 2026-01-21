import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchRequest {
  repo_url: string;
  branch?: string;
  path?: string;
  list_branches?: boolean;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  size?: number;
}

const ALLOWED_EXTENSIONS = ['.sol', '.json', '.md', '.txt', '.js', '.ts', '.yaml', '.yml', '.toml'];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_FILES = 100;

function shouldIncludeFile(name: string): boolean {
  const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;
    
    return {
      owner: pathParts[0],
      repo: pathParts[1].replace(/\.git$/, ''),
    };
  } catch {
    return null;
  }
}

async function fetchWithAuth(url: string, accessToken?: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Solarizer-Security-Audit',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return fetch(url, { headers });
}

async function fetchDirectoryContents(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  accessToken?: string,
  collectedFiles: Array<{ name: string; path: string; content: string }> = [],
  depth: number = 0
): Promise<Array<{ name: string; path: string; content: string }>> {
  if (depth > 5 || collectedFiles.length >= MAX_FILES) {
    return collectedFiles;
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetchWithAuth(apiUrl, accessToken);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository or path not found. Make sure the repository is public or you have connected your GitHub account.');
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Connect your GitHub account for higher limits.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const contents: GitHubFile[] = await response.json();
  
  // Skip common non-source directories
  const skipDirs = ['node_modules', 'lib', '.git', 'build', 'out', 'artifacts', 'cache'];
  
  for (const item of contents) {
    if (collectedFiles.length >= MAX_FILES) break;
    
    if (item.type === 'dir') {
      if (skipDirs.includes(item.name)) continue;
      
      await fetchDirectoryContents(
        owner, repo, item.path, branch, accessToken, collectedFiles, depth + 1
      );
    } else if (item.type === 'file' && shouldIncludeFile(item.name)) {
      if (item.size && item.size > MAX_FILE_SIZE) continue;
      
      // Fetch file content
      if (item.download_url) {
        try {
          const fileResponse = await fetch(item.download_url);
          if (fileResponse.ok) {
            const content = await fileResponse.text();
            collectedFiles.push({
              name: item.name,
              path: item.path,
              content,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch file ${item.path}:`, e);
        }
      }
    }
  }

  return collectedFiles;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user's GitHub token if authenticated
    const authHeader = req.headers.get('authorization');
    let accessToken: string | undefined;

    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get user from JWT
      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(jwt);

      if (user) {
        // Check if user has GitHub connection
        const { data: connection } = await supabase
          .from('github_connections')
          .select('github_access_token')
          .eq('user_id', user.id)
          .single();

        if (connection) {
          accessToken = connection.github_access_token;
        }
      }
    }

    const body: FetchRequest = await req.json();
    const { repo_url, branch, path, list_branches } = body;

    const parsed = parseGitHubUrl(repo_url);
    if (!parsed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid GitHub URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { owner, repo } = parsed;

    // If listing branches
    if (list_branches) {
      const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
      const response = await fetchWithAuth(branchesUrl, accessToken);
      
      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: true, branches: ['main', 'master'] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const branches = await response.json();
      return new Response(
        JSON.stringify({ success: true, branches: branches.map((b: { name: string }) => b.name) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine default branch
    let targetBranch = branch || 'main';
    if (!branch) {
      const repoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const repoResponse = await fetchWithAuth(repoUrl, accessToken);
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        targetBranch = repoData.default_branch || 'main';
      }
    }

    // Fetch files
    const files = await fetchDirectoryContents(
      owner, repo, path || '', targetBranch, accessToken
    );

    console.log(`github-fetch-repo: Fetched ${files.length} files from ${owner}/${repo}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        files,
        repo: { owner, repo, branch: targetBranch, path: path || '' },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('github-fetch-repo error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
