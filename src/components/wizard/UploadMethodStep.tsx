import { FolderUp, Code, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type UploadMethod = 'folder' | 'editor';

interface UploadMethodStepProps {
  onSelectMethod: (method: UploadMethod) => void;
  onBack: () => void;
  isStarterPlan?: boolean;
}

const UploadMethodStep = ({ onSelectMethod, onBack, isStarterPlan = false }: UploadMethodStepProps) => {
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
                  "group relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-border",
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
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                  isStarterPlan ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <FolderUp className={cn("w-8 h-8", isStarterPlan ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Upload Project Folder
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your entire project including all subfolders and files. Supports nested directories.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {['.sol', '.json', '.md', '.txt'].map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
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

        {/* Code Editor Option */}
        <button
          onClick={() => onSelectMethod('editor')}
          className={cn(
            "group relative flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-border",
            "hover:border-primary hover:bg-primary/5 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Code className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Use Code Editor
            </h3>
            <p className="text-sm text-muted-foreground">
              Paste or write your smart contract directly in the built-in code editor.
              {isStarterPlan && " Single file only on Starter plan."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              Paste code
            </span>
            {!isStarterPlan && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                Multi-file
              </span>
            )}
          </div>
        </button>
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
