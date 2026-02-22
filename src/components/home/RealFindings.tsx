import { findings, severityBorder, severityBadge } from "./findingsData";

const RealFindings = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        See what Solarizer actually detects
      </h2>

      <div className="mt-10 md:mt-14 space-y-[16px] md:space-y-[22px] max-w-3xl mx-auto">
        {findings.map((f) => (
          <div
            key={f.title}
            className={`rounded-[14px] md:rounded-[16px] border border-border/20 bg-card/20 p-5 md:p-7 border-l-[3px] ${severityBorder[f.severity]} hover:border-opacity-60 transition-colors`}
          >
            <span className={`${severityBadge[f.severity]} text-[11px] md:text-[12px] font-mono font-bold px-2.5 py-1 rounded-md inline-block`}>
              {f.severity}
            </span>
            <p className="text-[14px] md:text-[16px] font-semibold text-foreground mt-3">{f.title}</p>
            <p className="text-[12px] md:text-[13px] font-mono text-muted-foreground/50 mt-1">{f.file}</p>
            <p className="text-[14px] md:text-[15px] text-muted-foreground/60 mt-2 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default RealFindings;
