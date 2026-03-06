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
  pro: { nlocPerScan: 3000, initialCredits: 100 },
  business: { nlocPerScan: 9999, initialCredits: 200 },
  trial: { nlocPerScan: 9999, initialCredits: 300 },
} as const;

/**
 * Credits granted when purchasing/activating a plan
 */
export const SUBSCRIPTION_CREDITS = {
  starter: 50,
  pro: 100,
  business: 200,
  trial: 300,
} as const;

/**
 * Credit rates per plan (in cents) — flat $1.00 per credit across all plans
 */
export const PLAN_CREDIT_RATES = {
  starter: 100,  // $1.00 per credit
  pro: 100,      // $1.00 per credit
  business: 100, // $1.00 per credit
  trial: 100,    // $1.00 per credit
} as const;

/**
 * Calculate credits after downgrade.
 * With flat $1 pricing, credits transfer 1:1 across all plans.
 * Kept for API compatibility.
 */
export function calculateDowngradeCredits(
  currentCredits: number,
  _fromPlan: keyof typeof PLAN_CREDIT_RATES,
  _toPlan: keyof typeof PLAN_CREDIT_RATES
): number {
  return currentCredits;
}

