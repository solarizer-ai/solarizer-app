import { X, Check } from "lucide-react";

const manual = [
  "Takes weeks",
  "Expensive to repeat",
  "Limited reruns",
];

const solarizer = [
  "Runs in minutes",
  "Unlimited reruns",
  "Detects exploit chains early",
];

const SpeedPositioning = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        Run Solarizer before your manual audit
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-10 md:mt-14 max-w-3xl mx-auto">
        {/* Manual */}
        <div className="rounded-[14px] md:rounded-[16px] border border-border/20 bg-card/10 p-5 md:p-7">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-5">
            Manual audit
          </p>
          <ul className="space-y-3">
            {manual.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground/40">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/30" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Solarizer */}
        <div className="rounded-[14px] md:rounded-[16px] border border-primary/20 bg-card/20 p-5 md:p-7">
          <p className="text-xs font-mono uppercase tracking-widest text-primary/60 mb-5">
            Solarizer
          </p>
          <ul className="space-y-3">
            {solarizer.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground/80">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default SpeedPositioning;
