import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Crown, Shield, User, Trash2 } from "lucide-react";
import { useTeamMembers, useRemoveTeamMember } from "@/hooks/useTeam";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMembersListProps {
  teamId: string;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleColors = {
  owner: "text-warning bg-warning/10 border-warning/20",
  admin: "text-primary bg-primary/10 border-primary/20",
  member: "text-muted-foreground bg-muted border-border",
};

export function TeamMembersList({ teamId }: TeamMembersListProps) {
  const { user } = useAuth();
  const { data: members, isLoading } = useTeamMembers(teamId);
  const removeMember = useRemoveTeamMember();

  const currentMember = members?.find(m => m.user_id === user?.id);
  const canManageMembers = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from the team?`)) return;
    
    try {
      await removeMember.mutateAsync({ memberId, teamId });
      toast.success(`${email} removed from team`);
    } catch (error) {
      toast.error("Failed to remove member");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Team Members ({members?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members?.map((member) => {
            const RoleIcon = roleIcons[member.role];
            const isCurrentUser = member.user_id === user?.id;
            const canRemove = canManageMembers && member.role !== 'owner' && !isCurrentUser;

            return (
              <div
                key={member.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isCurrentUser ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    roleColors[member.role]
                  )}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.user_email}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-1">(you)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs capitalize border", roleColors[member.role])}
                      >
                        {member.role}
                      </Badge>
                      <span>•</span>
                      <span>
                        Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive opacity-100"
                    onClick={() => handleRemove(member.id, member.user_email || '')}
                    disabled={removeMember.isPending}
                  >
                    {removeMember.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
