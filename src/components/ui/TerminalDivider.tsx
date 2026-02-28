import { cn } from "@/lib/utils";

interface TerminalDividerProps {
  label: string;
  right?: React.ReactNode;
  className?: string;
}

export const TerminalDivider = ({ label, right, className }: TerminalDividerProps) => {
  const dashCount = Math.max(4, 44 - label.length);
  const dashes = "─".repeat(dashCount);

  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground/40 font-mono text-[11px] select-none", className)}>
      <span className="whitespace-nowrap">── {label} {dashes}</span>
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
  );
};
