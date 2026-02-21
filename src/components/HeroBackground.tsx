import { useState, useCallback } from "react";

const HeroBackground = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Mouse tracking layer */}
      <div
        className="absolute inset-0 z-10 pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Orange glow that follows cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: mouse.active ? 1 : 0,
          background: `radial-gradient(circle 120px at ${mouse.x}px ${mouse.y}px, hsl(24 95% 53% / 0.25), transparent)`,
        }}
      />

      {/* Dot grid with slow drift */}
      <div className="absolute inset-0 hero-dot-grid opacity-40 pointer-events-none" />

      {/* Concentric pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="hero-pulse-ring w-[280px] h-[280px] rounded-full border border-foreground/[0.06]" style={{ animationDelay: "0s" }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="hero-pulse-ring w-[480px] h-[480px] rounded-full border border-foreground/[0.05]" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="hero-pulse-ring w-[700px] h-[700px] rounded-full border border-foreground/[0.04]" style={{ animationDelay: "3s" }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="hero-pulse-ring w-[940px] h-[940px] rounded-full border border-foreground/[0.03]" style={{ animationDelay: "4.5s" }} />
      </div>
    </div>
  );
};

export default HeroBackground;
