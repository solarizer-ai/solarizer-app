import { ShieldCheck, Database, Code } from "lucide-react";

const signals = [
  {
    icon: ShieldCheck,
    text: "Detects dozens of vulnerability classes",
  },
  {
    icon: Database,
    text: "Tested against historical exploit datasets",
  },
  {
    icon: Code,
    text: "Designed for production Solidity protocols",
  },
];

const TrustSignals = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
        {signals.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.text} className="flex flex-col items-center text-center gap-3 py-6">
              <Icon className="w-6 h-6 text-primary" />
              <p className="text-sm text-muted-foreground/70">{s.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default TrustSignals;
