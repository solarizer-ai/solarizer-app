const steps = [
  {
    num: 1,
    label: "Install",
    code: "curl -fsSL https://solarizer.io/install.sh | bash",
  },
  {
    num: 2,
    label: "Run",
    code: "solarizer",
  },
  {
    num: 3,
    label: "Analyze",
    text: "Solarizer analyzes dependencies, interactions, and invariants",
  },
  {
    num: 4,
    label: "Report",
    text: "Terminal + full report generated",
  },
];

const HowItWorks = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        From install to report in one command
      </h2>

      <div className="relative mt-10 md:mt-14 max-w-2xl mx-auto">
        {/* Connecting line */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px border-l border-dashed border-border/20" />

        <div className="flex flex-col gap-3.5 md:gap-5">
          {steps.map((step) => (
            <div key={step.num} className="relative flex items-start gap-4 md:gap-6">
              {/* Number */}
              <div className="relative z-10 shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-full bg-card border border-border/30 flex items-center justify-center">
                <span className="text-sm md:text-base font-mono font-bold text-primary">
                  {step.num}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2 md:pt-3">
                <p className="text-sm font-semibold text-foreground mb-2">{step.label}</p>
                {step.code ? (
                  <div className="rounded-xl bg-[#050505] border border-border/20 px-4 py-3 font-mono text-[13px] text-foreground/80 overflow-x-auto">
                    <span className="text-muted-foreground/40">$ </span>
                    {step.code}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/60 leading-relaxed">{step.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
