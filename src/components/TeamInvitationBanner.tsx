import { useState } from "react";
import { Users, Clock, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyInvitations, useAcceptInvitation } from "@/hooks/useTeam";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function TeamInvitationBanner() {
  const { data: invitations, isLoading } = useMyInvitations();
  const acceptInvitation = useAcceptInvitation();
  const queryClient = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation.mutateAsync(invitationId);
      toast.success("You've joined the team!");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
    }
  };

  const handleDecline = async (invitationId: string) => {
    setDecliningId(invitationId);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      toast.success("Invitation declined");
    } catch (error: any) {
      toast.error(error.message || "Failed to decline invitation");
    } finally {
      setDecliningId(null);
    }
  };

  if (isLoading || !invitations?.length) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {invitations.map((invitation: any) => (
        <Card 
          key={invitation.id}
          className="p-4 border-primary/30 bg-primary/5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  You're invited to join <span className="text-primary">{invitation.teams?.name || 'a team'}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="capitalize">Role: {invitation.role}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecline(invitation.id)}
                disabled={decliningId === invitation.id || acceptInvitation.isPending}
              >
                {decliningId === invitation.id ? (
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
                onClick={() => handleAccept(invitation.id)}
                disabled={acceptInvitation.isPending || decliningId === invitation.id}
              >
                {acceptInvitation.isPending ? (
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
        </Card>
      ))}
    </div>
  );
}
