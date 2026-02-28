import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  variant?: "hero" | "data";
  title?: string;
  noPadding?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const TerminalPanel = ({
  variant = "data",
  title,
  noPadding = false,
  className,
  children,
}: TerminalPanelProps) => {
  return (
    <div className={cn("rounded-xl ring-1 ring-white/[0.05] overflow-hidden", className)}>
      {variant === "hero" && (
        <div className="h-8 bg-[#0f0f0f] flex items-center px-3 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
          </div>
          <span className="flex-1 text-center text-[11px] font-mono text-muted-foreground/40">
            {title ?? "solarizer"}
          </span>
        </div>
      )}
      <div
        className={cn(
          "bg-[#050505]",
          !noPadding && "p-4 md:p-5"
        )}
      >
        {children}
      </div>
    </div>
  );
};
