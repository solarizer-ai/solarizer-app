import { Layers, Fingerprint, Search, GitBranch, FileText } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Complexity Analysis",
    description: "Classifies each contract by complexity; novel contracts trigger deeper second-pass analysis",
  },
  {
    icon: Fingerprint,
    title: "Exploit Pattern Matching",
    description: "Contract logic matched against a massive database of exploit signatures from real post-mortems",
  },
  {
    icon: Search,
    title: "Red-Team Simulation",
    description: "Adversarial AI probes each contract; complex contracts receive a second pass for chained exploits",
  },
  {
    icon: GitBranch,
    title: "Cross-Contract Tracing",
    description: "Traces attack paths across contract boundaries — shared state corruption and inconsistent trust assumptions",
  },
  {
    icon: FileText,
    title: "Line-Accurate Remediation",
    description: "Reads original source to locate each finding, extract vulnerable code, and produce exact fixes",
  },
];

const EngineExplanation = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        Five phases. One command.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] md:gap-6 mt-10 md:mt-14 max-w-4xl mx-auto">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-[12px] md:rounded-[16px] border border-border/20 bg-card/20 p-[18px] md:p-7 hover:border-primary/20 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary mb-3" />
              <p className="text-sm md:text-base font-semibold text-foreground">{f.title}</p>
              <p className="text-xs md:text-sm text-muted-foreground/60 mt-1.5 leading-relaxed line-clamp-2">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default EngineExplanation;
