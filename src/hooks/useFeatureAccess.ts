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
}

/**
 * Hook to determine feature access based on user's subscription plan.
 * 
 * Plan hierarchy:
 * - starter (Spark): Basic features only
 * - pro (Blaze): Remediation, Export, QA Findings
 * - business (Inferno): All Blaze features + Sharing, Comments
 */
export function useFeatureAccess(): FeatureAccess {
  const { data: subscription, isLoading } = useSubscription();

  const access = useMemo(() => {
    const plan = (subscription?.plan || null) as ExtendedSubscriptionPlan | null;
    
    const hasSubscription = plan !== null;
    const isPro = plan === 'pro' || plan === 'business';
    const isBusiness = plan === 'business';

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
    };
  }, [subscription, isLoading]);

  return access;
}

/**
 * Get the required plan for a specific feature
 */
export function getRequiredPlanForFeature(feature: keyof Omit<FeatureAccess, 'currentPlan' | 'isLoading' | 'hasSubscription'>): 'pro' | 'business' {
  const businessFeatures = ['canShareReports', 'canCommentOnFindings'];
  return businessFeatures.includes(feature) ? 'business' : 'pro';
}
