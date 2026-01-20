import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MinimalFooter from "@/components/MinimalFooter";
import { TeamMembersList } from "@/components/team/TeamMembersList";
import { TeamInviteForm } from "@/components/team/TeamInviteForm";
import { CreateTeamCard } from "@/components/team/CreateTeamCard";
import { PendingInvitations } from "@/components/team/PendingInvitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Building2, Check, Pencil } from "lucide-react";
import { useTeam, useTeamMembers, useTeamInvitations, useUpdateTeam } from "@/hooks/useTeam";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FeatureLockedOverlay } from "@/components/FeatureLockedOverlay";
import { toast } from "sonner";

const TeamSettings = () => {
  const navigate = useNavigate();
  const { canAddTeamMembers, isLoading: accessLoading } = useFeatureAccess();
  const { data: team, isLoading: teamLoading } = useTeam();
  const { data: members } = useTeamMembers(team?.id);
  const { data: invitations } = useTeamInvitations(team?.id);
  const updateTeam = useUpdateTeam();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [teamName, setTeamName] = useState("");

  const handleSaveName = async () => {
    if (!team || !teamName.trim()) return;
    
    try {
      await updateTeam.mutateAsync({ teamId: team.id, name: teamName.trim() });
      setIsEditingName(false);
      toast.success("Team name updated");
    } catch (error) {
      toast.error("Failed to update team name");
    }
  };

  const isLoading = accessLoading || teamLoading;
  const memberCount = members?.length || 0;
  const pendingCount = invitations?.length || 0;
  const totalSlots = 5;
  const remainingSlots = totalSlots - memberCount - pendingCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-6 py-8 flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <MinimalFooter />
      </div>
    );
  }

  // Show upgrade prompt for non-Business users
  if (!canAddTeamMembers) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-6 py-8 flex-1">
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => navigate("/settings")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              ← Back to Settings
            </button>
            <FeatureLockedOverlay
              featureName="Team Management"
              requiredPlan="business"
              description="Collaborate with your team by inviting up to 5 members to share audits and track remediation progress together."
              onUpgrade={() => navigate("/pricing")}
            />
          </div>
        </main>
        <MinimalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-3xl mx-auto space-y-6">
          <button 
            onClick={() => navigate("/settings")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Settings
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Team Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your team members and invitations
              </p>
            </div>
          </div>

          {/* Create Team or Team Details */}
          {!team ? (
            <CreateTeamCard />
          ) : (
            <>
              {/* Team Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      {isEditingName ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="h-8 w-48"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            disabled={updateTeam.isPending}
                          >
                            {updateTeam.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsEditingName(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setTeamName(team.name);
                              setIsEditingName(true);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {memberCount}/{totalSlots} members
                    </div>
                  </div>
                  <CardDescription>
                    {remainingSlots > 0 
                      ? `You can invite ${remainingSlots} more team member${remainingSlots !== 1 ? 's' : ''}`
                      : "Your team is at maximum capacity"
                    }
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Invite Form */}
              {remainingSlots > 0 && (
                <TeamInviteForm teamId={team.id} />
              )}

              {/* Pending Invitations */}
              <PendingInvitations teamId={team.id} />

              {/* Team Members */}
              <TeamMembersList teamId={team.id} />
            </>
          )}
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default TeamSettings;
