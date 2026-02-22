import { X, Check } from "lucide-react";

const traditional = [
  "Pattern detection only",
  "Single-contract analysis",
  "No callback reasoning",
  "Miss exploit chains",
];

const solarizer = [
  "Traces cross-contract attack paths",
  "Simulates chained exploits",
  "Validates accounting invariants",
  "Detects callback ordering attacks",
];

const DifferentiatorComparison = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        Most scanners check contracts.{" "}
        <span className="text-gradient">Solarizer models the entire protocol.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10 md:mt-14">
        {/* Traditional */}
        <div className="rounded-2xl border border-border/20 bg-card/10 p-6 md:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40 mb-5">
            Traditional scanners
          </p>
          <ul className="space-y-3">
            {traditional.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground/40">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-red-400/50" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Solarizer */}
        <div className="rounded-2xl border border-primary/20 bg-card/30 p-6 md:p-8 sm:p-[calc(1.5rem+8px)] md:p-[calc(2rem+8px)]">
          <p className="text-xs font-mono uppercase tracking-widest text-primary/60 mb-5">
            Solarizer
          </p>
          <ul className="space-y-3">
            {solarizer.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground/80">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-400" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default DifferentiatorComparison;
