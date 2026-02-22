import { ShieldCheck, Database, Code2 } from "lucide-react";

const signals = [
  {
    icon: ShieldCheck,
    stat: "Dozens",
    label: "of vulnerability classes detected",
  },
  {
    icon: Database,
    stat: "Tested",
    label: "against historical exploit datasets",
  },
  {
    icon: Code2,
    stat: "Built",
    label: "for production Solidity protocols",
  },
];

const TrustSignals = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {signals.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="text-center">
              <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-2xl md:text-3xl font-black text-foreground">{s.stat}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default TrustSignals;
