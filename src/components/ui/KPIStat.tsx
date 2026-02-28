import { cn } from "@/lib/utils";

interface KPIStatProps {
  value: string | number;
  label: string;
  subLabel?: string;
  valueClassName?: string;
  className?: string;
}

export const KPIStat = ({ value, label, subLabel, valueClassName, className }: KPIStatProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("font-mono text-3xl sm:text-4xl font-bold text-foreground", valueClassName)}>
        {value}
      </span>
      <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground/50 mt-1">
        {label}
      </span>
      {subLabel && (
        <span className="text-[10px] text-muted-foreground/30 mt-0.5">
          {subLabel}
        </span>
      )}
    </div>
  );
};
