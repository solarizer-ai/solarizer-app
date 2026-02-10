import { useMemo } from "react";
import { useSubscription, SubscriptionPlan } from "./useSubscription";

export type ExtendedSubscriptionPlan = SubscriptionPlan | 'business';

export interface FeatureAccess {
  // Pro+ features
  canViewRemediation: boolean;
  canExportReport: boolean;
  canViewQAFindings: boolean; // low/info severity
  canViewSecurityCoverage: boolean;
  
  // Business only features
  canShareReports: boolean;
  canCommentOnFindings: boolean;
  
  // Plan info
  currentPlan: ExtendedSubscriptionPlan;
  isLoading: boolean;
  hasSubscription: boolean;
}

/**
 * Hook to determine feature access based on user's subscription plan.
 * 
 * Plan hierarchy:
 * - starter: Basic features only
 * - pro: Remediation, Export, QA Findings, Security Coverage
 * - business: All Pro features + Sharing, Comments
 */
export function useFeatureAccess(): FeatureAccess {
  const { data: subscription, isLoading } = useSubscription();

  const access = useMemo(() => {
    // No subscription = no plan, all features locked
    const plan = (subscription?.plan || null) as ExtendedSubscriptionPlan | null;
    
    const hasSubscription = plan !== null;
    const isPro = plan === 'pro' || plan === 'business';
    const isBusiness = plan === 'business';

    return {
      // Pro+ features
      canViewRemediation: isPro,
      canExportReport: isPro,
      canViewQAFindings: isPro,
      canViewSecurityCoverage: isPro,
      
      // Business only features
      canShareReports: isBusiness,
      canCommentOnFindings: isBusiness,
      
      // Plan info
      currentPlan: plan as ExtendedSubscriptionPlan,
      isLoading,
      hasSubscription,
    };
  }, [subscription, isLoading]);

  return access;
}

/**
 * Get the required plan for a specific feature
 */
export function getRequiredPlanForFeature(feature: keyof Omit<FeatureAccess, 'currentPlan' | 'isLoading'>): 'pro' | 'business' {
  const businessFeatures = ['canShareReports', 'canCommentOnFindings'];
  return businessFeatures.includes(feature) ? 'business' : 'pro';
}
