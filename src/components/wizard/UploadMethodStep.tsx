import { FolderUp, ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";

export type UploadMethod = 'folder' | 'github';

interface UploadMethodStepProps {
  onSelectMethod: (method: UploadMethod) => void;
  onBack: () => void;
}

const UploadMethodStep = ({ onSelectMethod, onBack }: UploadMethodStepProps) => {
  const { isConnected, connection } = useGitHubConnection();

  const MethodCard = ({ method, icon: Icon, title, description, badges }: { method: UploadMethod; icon: typeof FolderUp; title: string; description: string; badges: React.ReactNode }) => (
    <button
      onClick={() => onSelectMethod(method)}
      className={cn(
        "group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        "hover:border-primary hover:bg-primary/5"
      )}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors bg-primary/10 group-hover:bg-primary/20">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-1 justify-center">{badges}</div>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">How would you like to add your code?</h2>
        <p className="text-sm text-muted-foreground">Choose how you want to provide your smart contracts for analysis</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MethodCard method="folder" icon={FolderUp} title="Upload Folder" description="Upload your entire project with all subfolders"
          badges={['.sol', '.json', '.md'].map(ext => <span key={ext} className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">{ext}</span>)} />
        <MethodCard method="github" icon={Github} title="Import from GitHub" description="Fetch contracts from a GitHub repository"
          badges={isConnected ? <span className="px-1.5 py-0.5 text-xs rounded-full bg-success/10 text-success">@{connection?.github_username}</span> : <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">Public repos</span>} />
      </div>
      <div className="flex justify-center">
        <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
      </div>
    </div>
  );
};

export default UploadMethodStep;
