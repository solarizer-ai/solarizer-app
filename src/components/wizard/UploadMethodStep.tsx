import { FolderUp, ArrowLeft, Lock, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";

export type UploadMethod = 'folder' | 'github';

interface UploadMethodStepProps {
  onSelectMethod: (method: UploadMethod) => void;
  onBack: () => void;
  isStarterPlan?: boolean;
}

const UploadMethodStep = ({ onSelectMethod, onBack, isStarterPlan = false }: UploadMethodStepProps) => {
  const { isConnected, connection } = useGitHubConnection();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-foreground">
          How would you like to add your code?
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how you want to provide your smart contracts for analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Folder Option */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => !isStarterPlan && onSelectMethod('folder')}
                disabled={isStarterPlan}
                className={cn(
                  "group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  isStarterPlan 
                    ? "opacity-60 cursor-not-allowed" 
                    : "hover:border-primary hover:bg-primary/5"
                )}
              >
                {isStarterPlan && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Pro
                    </span>
                  </div>
                )}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  isStarterPlan ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <FolderUp className={cn("w-7 h-7", isStarterPlan ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    Upload Folder
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Upload your entire project with all subfolders
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {['.sol', '.json', '.md'].map((ext) => (
                    <span
                      key={ext}
                      className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </button>
            </TooltipTrigger>
            {isStarterPlan && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p>Multi-file uploads require the Pro plan. Upgrade to analyze entire projects.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* GitHub Import Option */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => !isStarterPlan && onSelectMethod('github')}
                disabled={isStarterPlan}
                className={cn(
                  "group relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  isStarterPlan 
                    ? "opacity-60 cursor-not-allowed" 
                    : "hover:border-primary hover:bg-primary/5"
                )}
              >
                {isStarterPlan && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      Pro
                    </span>
                  </div>
                )}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  isStarterPlan ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <Github className={cn("w-7 h-7", isStarterPlan ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-semibold text-foreground">
                    Import from GitHub
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Fetch contracts from a GitHub repository
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {isConnected ? (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-success/10 text-success">
                      @{connection?.github_username}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      Public repos
                    </span>
                  )}
                </div>
              </button>
            </TooltipTrigger>
            {isStarterPlan && (
              <TooltipContent side="bottom" className="max-w-xs">
                <p>GitHub import requires the Pro plan. Upgrade to import from repositories.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  );
};

export default UploadMethodStep;
