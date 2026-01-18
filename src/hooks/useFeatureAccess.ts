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
  canAddTeamMembers: boolean;
  canCommentOnFindings: boolean;
  
  // Plan info
  currentPlan: ExtendedSubscriptionPlan;
  isLoading: boolean;
}

/**
 * Hook to determine feature access based on user's subscription plan.
 * 
 * Plan hierarchy:
 * - starter: Basic features only
 * - pro: Remediation, Export, QA Findings, Security Coverage
 * - business: All Pro features + Sharing, Team Members, Comments
 */
export function useFeatureAccess(): FeatureAccess {
  const { data: subscription, isLoading } = useSubscription();

  const access = useMemo(() => {
    // Default to starter if no subscription
    const plan = (subscription?.plan || 'starter') as ExtendedSubscriptionPlan;
    
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
      canAddTeamMembers: isBusiness,
      canCommentOnFindings: isBusiness,
      
      // Plan info
      currentPlan: plan,
      isLoading,
    };
  }, [subscription, isLoading]);

  return access;
}

/**
 * Get the required plan for a specific feature
 */
export function getRequiredPlanForFeature(feature: keyof Omit<FeatureAccess, 'currentPlan' | 'isLoading'>): 'pro' | 'business' {
  const businessFeatures = ['canShareReports', 'canAddTeamMembers', 'canCommentOnFindings'];
  return businessFeatures.includes(feature) ? 'business' : 'pro';
}
