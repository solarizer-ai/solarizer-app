/**
 * Shared plan name mapping.
 * All paid plans map to "Inferno" (single plan). Legacy DB values (starter, pro) also resolve to Inferno.
 */
export function formatPlanName(plan: string | null): string {
  if (!plan) return 'None';
  const names: Record<string, string> = {
    starter: 'Inferno',
    pro: 'Inferno',
    business: 'Inferno',
    trial: 'Free Trial',
  };
  return names[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
}
