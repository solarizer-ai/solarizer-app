import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, X, UserPlus } from "lucide-react";
import { useTeamInvitations, useCancelInvitation } from "@/hooks/useTeam";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PendingInvitationsProps {
  teamId: string;
}

export function PendingInvitations({ teamId }: PendingInvitationsProps) {
  const { data: invitations, isLoading } = useTeamInvitations(teamId);
  const cancelInvitation = useCancelInvitation();

  const handleCancel = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({ invitationId, teamId });
      toast.success("Invitation cancelled");
    } catch (error) {
      toast.error("Failed to cancel invitation");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="w-4 h-4" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{invitation.email}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {invitation.role}
                    </Badge>
                    <span>•</span>
                    <span>
                      Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleCancel(invitation.id)}
                disabled={cancelInvitation.isPending}
              >
                {cancelInvitation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
