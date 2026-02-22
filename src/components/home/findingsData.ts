export const findings = [
  {
    severity: "CRITICAL",
    title: "Read-only reentrancy via getPricePerShare()",
    file: "Vault.sol · line 334",
    description:
      "getPricePerShare() reads totalAssets() during an active withdrawal. An attacker exploits this stale mid-callback value to inflate collateral valuation in a dependent lending protocol.",
  },
  {
    severity: "HIGH",
    title: "Fee-on-transfer token insolvency",
    file: "DepositHandler.sol · line 89",
    description:
      "Protocol records msg.value as deposited without measuring the actual received balance. Recorded liability grows faster than real holdings.",
  },
  {
    severity: "MEDIUM",
    title: "TWAP manipulation risk",
    file: "PriceOracle.sol · line 211",
    description:
      "15-minute window allows single-block price manipulation on thin markets, affecting liquidations, collateral checks, and rebalances.",
  },
];

export const severityBorder: Record<string, string> = {
  CRITICAL: "border-l-red-500/30",
  HIGH: "border-l-orange-500/30",
  MEDIUM: "border-l-yellow-500/30",
};

export const severityBadge: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-500",
};
