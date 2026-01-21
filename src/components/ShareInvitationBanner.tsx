import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PendingShareInvitation {
  id: string;
  audit_id: string;
  owner_id: string;
  project_name: string;
  owner_email: string;
  owner_display_name: string;
  invited_at: string;
  expires_at: string;
}

export function ShareInvitationBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['pending-share-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_pending_share_invitations');
      if (error) throw error;
      return data as PendingShareInvitation[];
    },
    enabled: !!user,
  });

  const acceptMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { data, error } = await supabase.rpc('accept_share_invitation', {
        p_share_id: shareId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; audit_id?: string };
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-share-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success("Invitation accepted! You now have access to the report.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept invitation");
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from('audit_shares')
        .delete()
        .eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-share-invitations'] });
      toast.success("Invitation declined");
    },
    onError: () => {
      toast.error("Failed to decline invitation");
    },
  });

  if (isLoading || !invitations || invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">
                    You've been invited to view "{invitation.project_name}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>
                      From {invitation.owner_display_name || invitation.owner_email}
                    </span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => declineMutation.mutate(invitation.id)}
                  disabled={declineMutation.isPending || acceptMutation.isPending}
                >
                  {declineMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate(invitation.id)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
