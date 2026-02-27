/**
 * Calculates Normalized Lines of Code (nLOC) for Solidity source code.
 * Strips comments and whitespace to count only actual logic lines.
 */
export function calculateNLOC(code: string): number {
  if (!code || typeof code !== 'string') {
    return 0;
  }

  // Remove multi-line comments /* ... */
  let processed = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove single-line comments // ...
  processed = processed.replace(/\/\/.*$/gm, '');

  // Split into lines
  const lines = processed.split('\n');

  // Count non-empty lines (after trimming whitespace)
  const nlocLines = lines.filter(line => line.trim().length > 0);

  return nlocLines.length;
}

/**
 * Validates if code size is within the allowed limit
 */
export function isWithinNLocLimit(code: string, limit: number): boolean {
  return calculateNLOC(code) <= limit;
}

/**
 * Constants for plan limits
 */
export const PLAN_LIMITS = {
  starter: { nlocPerScan: 500, initialCredits: 50 },
  pro: { nlocPerScan: 3000, initialCredits: 50 },
  business: { nlocPerScan: 9999, initialCredits: 50 },
} as const;

/**
 * Credits granted when purchasing a subscription
 */
export const SUBSCRIPTION_CREDITS = {
  starter: 50,
  pro: 50,
  business: 50,
} as const;

/**
 * Credit rates per plan (in cents)
 */
export const PLAN_CREDIT_RATES = {
  starter: 280,  // $2.80 per credit (Spark plan)
  pro: 250,      // $2.50 per credit (Blaze plan)
  business: 220, // $2.20 per credit (Inferno plan)
} as const;

/**
 * Calculate credits after downgrade using fair usage formula
 * New Balance = Floor((Remaining Credits * Old Plan Rate) / New Plan Rate)
 */
export function calculateDowngradeCredits(
  currentCredits: number,
  fromPlan: keyof typeof PLAN_CREDIT_RATES,
  toPlan: keyof typeof PLAN_CREDIT_RATES
): number {
  const oldRate = PLAN_CREDIT_RATES[fromPlan];
  const newRate = PLAN_CREDIT_RATES[toPlan];
  return Math.floor((currentCredits * oldRate) / newRate);
}

/**
 * Power-up options available for Pro users
 */
export const POWER_UP_OPTIONS = [
  { nloc: 2000, priceCents: 2500, savings: 1, discountPercent: 4 },
  { nloc: 5000, priceCents: 5500, savings: 10, discountPercent: 15 },
  { nloc: 12000, priceCents: 12000, savings: 36, discountPercent: 23 },
  { nloc: 25000, priceCents: 22500, savings: 100, discountPercent: 30 },
] as const;
