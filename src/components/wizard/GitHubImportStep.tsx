import { useState } from "react";
import { ArrowLeft, Github, Loader2, AlertCircle, FolderGit2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileNode } from "@/types/files";
import { parseGitHubUrl, isValidGitHubUrl, fetchRepoContents } from "@/lib/githubService";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";
import { toast } from "sonner";

interface GitHubImportStepProps {
  onFilesImported: (files: FileNode[]) => void;
  onBack: () => void;
}

const GitHubImportStep = ({ onFilesImported, onBack }: GitHubImportStepProps) => {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [subfolder, setSubfolder] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, connection } = useGitHubConnection();

  const parsedUrl = repoUrl ? parseGitHubUrl(repoUrl) : null;
  const isValidUrl = repoUrl ? isValidGitHubUrl(repoUrl) : true;

  const handleFetch = async () => {
    if (!parsedUrl) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const files = await fetchRepoContents(
        repoUrl,
        branch || parsedUrl.branch || undefined,
        subfolder || parsedUrl.path || undefined
      );

      if (files.length === 0) {
        setError("No supported files found in this repository. We look for .sol, .json, .md, .txt files.");
        return;
      }

      toast.success(`Imported ${files.length} files from GitHub`);
      onFilesImported(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch repository";
      setError(message);
      toast.error("Import failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Import from GitHub
        </h2>
        <p className="text-sm text-muted-foreground">
          Fetch smart contracts directly from a GitHub repository
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {isConnected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success">
            <Github className="w-4 h-4" />
            <span>Connected as @{connection?.github_username}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
            <Github className="w-4 h-4" />
            <span>Public repositories only</span>
          </div>
        )}
      </div>

      {/* Repository URL Input */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repo-url">Repository URL</Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="repo-url"
              type="url"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setError(null);
              }}
              className={`pl-10 ${!isValidUrl ? 'border-destructive' : ''}`}
            />
          </div>
          {!isValidUrl && (
            <p className="text-xs text-destructive">Please enter a valid GitHub URL</p>
          )}
          {parsedUrl && (
            <p className="text-xs text-muted-foreground">
              Repository: {parsedUrl.owner}/{parsedUrl.repo}
              {parsedUrl.branch && ` • Branch: ${parsedUrl.branch}`}
              {parsedUrl.path && ` • Path: ${parsedUrl.path}`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch">Branch (optional)</Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subfolder">Subfolder (optional)</Label>
            <Input
              id="subfolder"
              placeholder="contracts/"
              value={subfolder}
              onChange={(e) => setSubfolder(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isConnected && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
            <Github className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Connect your GitHub account in Settings to access private repositories and get higher rate limits.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          onClick={handleFetch}
          disabled={!parsedUrl || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FolderGit2 className="w-4 h-4" />
          )}
          {isLoading ? "Fetching..." : "Fetch Repository"}
        </Button>
      </div>
    </div>
  );
};

export default GitHubImportStep;
