import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, SubscriptionPlan } from "./useSubscription";

export type ExtendedSubscriptionPlan = SubscriptionPlan | 'business';

export interface ReportFeatureAccess {
  // Pro+ features
  canViewRemediation: boolean;
  canExportReport: boolean;
  canViewQAFindings: boolean;
  canViewSecurityCoverage: boolean;
  
  // Business only features
  canShareReports: boolean;
  canAddTeamMembers: boolean;
  canCommentOnFindings: boolean;
  
  // Collaborator restrictions (even with Business access on shared report)
  canEditCode: boolean;
  canPurchasePowerUps: boolean;
  
  // Context info
  isOwner: boolean;
  effectivePlan: ExtendedSubscriptionPlan;
  isLoading: boolean;
}

interface AuditAccessContext {
  is_owner: boolean;
  owner_plan: string;
  error?: string;
}

/**
 * Hook to determine feature access based on audit context.
 * 
 * For owned audits: Uses user's own subscription plan
 * For shared audits: Inherits owner's plan features (except power-ups and code editing)
 */
export function useReportFeatureAccess(auditId: string | null): ReportFeatureAccess {
  const { data: ownSubscription, isLoading: subscriptionLoading } = useSubscription();
  
  const { data: accessContext, isLoading: contextLoading } = useQuery({
    queryKey: ['audit-access-context', auditId],
    queryFn: async () => {
      if (!auditId) return null;
      
      const { data, error } = await supabase.rpc('get_audit_access_context', {
        p_audit_id: auditId
      });
      
      if (error) throw error;
      return data as unknown as AuditAccessContext;
    },
    enabled: !!auditId,
  });

  const isLoading = subscriptionLoading || contextLoading;
  
  // Determine ownership
  const isOwner = accessContext?.is_owner ?? true;
  
  // Determine effective plan
  let effectivePlan: ExtendedSubscriptionPlan = (ownSubscription?.plan || 'starter') as ExtendedSubscriptionPlan;
  
  // If viewing a shared report, inherit owner's plan (if higher)
  if (!isOwner && accessContext?.owner_plan) {
    const ownerPlan = accessContext.owner_plan as ExtendedSubscriptionPlan;
    const planHierarchy: ExtendedSubscriptionPlan[] = ['starter', 'pro', 'business'];
    const ownerPlanIndex = planHierarchy.indexOf(ownerPlan);
    const userPlanIndex = planHierarchy.indexOf(effectivePlan);
    
    // Use the higher of the two plans for feature access
    if (ownerPlanIndex > userPlanIndex) {
      effectivePlan = ownerPlan;
    }
  }
  
  const isPro = effectivePlan === 'pro' || effectivePlan === 'business';
  const isBusiness = effectivePlan === 'business';

  return {
    // Pro+ features - available if effective plan is Pro or higher
    canViewRemediation: isPro,
    canExportReport: isPro,
    canViewQAFindings: isPro,
    canViewSecurityCoverage: isPro,
    
    // Business only features - available if effective plan is Business
    canShareReports: isBusiness && isOwner, // Only owners can share
    canAddTeamMembers: isBusiness && isOwner, // Only owners manage teams
    canCommentOnFindings: isBusiness,
    
    // Collaborator restrictions - these are ONLY for the owner
    canEditCode: isOwner,
    canPurchasePowerUps: isOwner,
    
    // Context info
    isOwner,
    effectivePlan,
    isLoading,
  };
}
