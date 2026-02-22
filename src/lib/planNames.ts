/**
 * Shared plan name mapping.
 * Internal IDs (starter, pro, business) → Display names (Spark, Blaze, Inferno)
 */
export function formatPlanName(plan: string | null): string {
  if (!plan) return 'None';
  const names: Record<string, string> = {
    starter: 'Spark',
    pro: 'Blaze',
    business: 'Inferno',
  };
  return names[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
}
