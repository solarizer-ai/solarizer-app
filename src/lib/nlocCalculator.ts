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
  starter: {
    maxScans: 2,
    nlocPerScan: 150,
    maxFilesPerScan: 1,
  },
  pro: {
    monthlyNloc: 1500,
    unlimitedScans: true,
  },
} as const;

/**
 * Power-up options available for Pro users
 */
export const POWER_UP_OPTIONS = [
  { nloc: 2000, priceCents: 2500, savings: 1, discountPercent: 4 },
  { nloc: 5000, priceCents: 5500, savings: 10, discountPercent: 15 },
  { nloc: 12000, priceCents: 12000, savings: 36, discountPercent: 23 },
  { nloc: 25000, priceCents: 22500, savings: 100, discountPercent: 30 },
] as const;
