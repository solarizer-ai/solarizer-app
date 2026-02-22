const findings = [
  {
    severity: "CRITICAL",
    badgeClass: "bg-red-500/10 text-red-400",
    borderClass: "border-l-red-500/30",
    title: "Read-only reentrancy via getPricePerShare()",
    file: "Vault.sol · line 334",
    description:
      "getPricePerShare() reads totalAssets() during an active withdrawal. An attacker exploits this stale mid-callback value to inflate collateral valuation in a dependent lending protocol.",
  },
  {
    severity: "HIGH",
    badgeClass: "bg-orange-500/10 text-orange-400",
    borderClass: "border-l-orange-500/30",
    title: "Fee-on-transfer token insolvency",
    file: "DepositHandler.sol · line 89",
    description:
      "Protocol records msg.value as deposited without measuring the actual received balance. Recorded liability grows faster than real holdings.",
  },
  {
    severity: "MEDIUM",
    badgeClass: "bg-yellow-500/10 text-yellow-500",
    borderClass: "border-l-yellow-500/30",
    title: "TWAP manipulation risk",
    file: "PriceOracle.sol · line 211",
    description:
      "15-minute window allows single-block price manipulation on thin markets, affecting liquidations, collateral checks, and rebalances.",
  },
];

const RealFindings = () => (
  <section className="py-[70px] md:py-[90px] lg:py-[110px] xl:py-[140px]">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 xl:px-20">
      <h2 className="text-[clamp(1.6rem,5vw,5.5rem)] font-black tracking-tight leading-[1.15] text-center">
        See what Solarizer actually detects
      </h2>

      <div className="mt-10 md:mt-14 flex flex-col gap-4 md:gap-[22px]">
        {findings.map((f) => (
          <div
            key={f.title}
            className={`rounded-[14px] md:rounded-[16px] border border-border/20 border-l-[3px] ${f.borderClass} bg-card/20 p-5 md:p-7`}
          >
            <div className="space-y-1">
              <span className={`${f.badgeClass} text-[11px] font-mono font-bold px-2.5 py-1 rounded-md inline-block`}>
                {f.severity}
              </span>
            </div>
            <p className="text-base md:text-lg font-semibold text-foreground mt-3">{f.title}</p>
            <p className="text-xs md:text-[13px] font-mono text-muted-foreground/40 mt-1">{f.file}</p>
            <p className="text-sm md:text-[15px] text-muted-foreground/60 mt-3 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default RealFindings;
