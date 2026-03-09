import { useAdminRole } from "@/hooks/useAdminRole";
import { useStagingMode } from "@/hooks/useStagingMode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function StagingModeBanner() {
  const { isAdmin } = useAdminRole();
  const { isStagingMode, toggleStagingMode } = useStagingMode();

  if (!isAdmin) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Switch checked={isStagingMode} onCheckedChange={toggleStagingMode} />
        <Label className="text-sm font-medium cursor-pointer" onClick={toggleStagingMode}>
          ⚡ Staging Mode
        </Label>
      </div>
      {isStagingMode && (
        <p className="text-xs text-muted-foreground mt-2">
          Staging mode active — audits route to solarizer-ai-proxy-rnd
        </p>
      )}
    </div>
  );
}
