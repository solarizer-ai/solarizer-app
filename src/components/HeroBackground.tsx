const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Dot grid with slow drift */}
    <div className="absolute inset-0 hero-dot-grid opacity-20" />

    {/* Concentric pulse rings */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="hero-pulse-ring w-[280px] h-[280px] rounded-full border border-foreground/[0.03]" style={{ animationDelay: "0s" }} />
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="hero-pulse-ring w-[480px] h-[480px] rounded-full border border-foreground/[0.03]" style={{ animationDelay: "1.5s" }} />
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="hero-pulse-ring w-[700px] h-[700px] rounded-full border border-foreground/[0.02]" style={{ animationDelay: "3s" }} />
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="hero-pulse-ring w-[940px] h-[940px] rounded-full border border-foreground/[0.015]" style={{ animationDelay: "4.5s" }} />
    </div>
  </div>
);

export default HeroBackground;
