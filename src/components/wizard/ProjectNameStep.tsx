import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileCode } from "lucide-react";

interface ProjectNameStepProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onContinue: () => void;
}

const ProjectNameStep = ({
  projectName,
  onProjectNameChange,
  onContinue,
}: ProjectNameStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = projectName.trim().length >= 2;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      onContinue();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <FileCode className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Name your project
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Give your audit a meaningful name to identify it later
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="projectName" className="text-sm font-medium">
          Project Name
        </Label>
        <Input
          ref={inputRef}
          id="projectName"
          placeholder="e.g., DeFi Vault v2.1"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">
          Minimum 2 characters required
        </p>
      </div>

      <Button
        onClick={onContinue}
        disabled={!isValid}
        className="w-full h-12 text-base gap-2"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ProjectNameStep;
