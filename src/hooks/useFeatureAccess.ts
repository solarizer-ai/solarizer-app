import { useMemo } from "react";
import { useSubscription, SubscriptionPlan } from "./useSubscription";

export type ExtendedSubscriptionPlan = SubscriptionPlan | 'business';

export interface FeatureAccess {
  // Blaze+ features
  canViewRemediation: boolean;
  canExportReport: boolean;
  canViewQAFindings: boolean; // low/info severity

  // Inferno only features
  canShareReports: boolean;
  canCommentOnFindings: boolean;

  // Plan info
  currentPlan: ExtendedSubscriptionPlan;
  isLoading: boolean;
  hasSubscription: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
}

/**
 * Hook to determine feature access based on user's subscription plan.
 *
 * Plan hierarchy:
 * - starter (Spark): Basic features only
 * - pro (Blaze): Remediation, Export, QA Findings
 * - business (Inferno): All Blaze features + Sharing, Comments
 * - trial: Maps to Inferno-tier access for 14 days
 */
export function useFeatureAccess(): FeatureAccess {
  const { data: subscription, isLoading, isExpired } = useSubscription();

  const access = useMemo(() => {
    const plan = (subscription?.plan || null) as ExtendedSubscriptionPlan | null;

    // Trial maps to Inferno-tier access
    const effectivePlan = plan === 'trial' ? 'business' : plan;
    const isTrial = plan === 'trial';
    const isTrialExpired = isTrial && isExpired;

    // If subscription is expired, treat as no active plan
    const effectivelyActive = plan !== null && !isExpired;
    const hasSubscription = plan !== null;
    const isPro = effectivelyActive && (effectivePlan === 'pro' || effectivePlan === 'business');
    const isBusiness = effectivelyActive && effectivePlan === 'business';

    return {
      // Blaze+ features
      canViewRemediation: isPro,
      canExportReport: isPro,
      canViewQAFindings: isPro,

      // Inferno only features
      canShareReports: isBusiness,
      canCommentOnFindings: isBusiness,

      // Plan info
      currentPlan: plan as ExtendedSubscriptionPlan,
      isLoading,
      hasSubscription,
      isTrial,
      isTrialExpired,
    };
  }, [subscription, isLoading, isExpired]);

  return access;
}

/**
 * Get the required plan for a specific feature
 */
export function getRequiredPlanForFeature(feature: keyof Omit<FeatureAccess, 'currentPlan' | 'isLoading' | 'hasSubscription'>): 'pro' | 'business' {
  const businessFeatures = ['canShareReports', 'canCommentOnFindings'];
  return businessFeatures.includes(feature) ? 'business' : 'pro';
}
