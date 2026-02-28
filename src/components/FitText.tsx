import { useRef, useLayoutEffect, useCallback } from "react";

interface FitTextProps {
  as?: React.ElementType;
  min?: number;
  max?: number;
  className?: string;
  children: React.ReactNode;
}

export function FitText({
  as: Tag = "span",
  min = 16,
  max = 88,
  className,
  children,
}: FitTextProps) {
  const ref = useRef<HTMLElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    const parentWidth = parent.clientWidth;
    if (parentWidth === 0) return;

    // Binary search for the largest font size that doesn't overflow
    let lo = min;
    let hi = max;

    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth > parentWidth) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    el.style.fontSize = `${lo}px`;
  }, [min, max]);

  useLayoutEffect(() => {
    fit();

    const parent = ref.current?.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ whiteSpace: "nowrap", overflow: "hidden", display: "block" }}
    >
      {children}
    </Tag>
  );
}
