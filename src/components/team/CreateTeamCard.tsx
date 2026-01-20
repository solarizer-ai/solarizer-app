import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Plus } from "lucide-react";
import { useCreateTeam } from "@/hooks/useTeam";
import { toast } from "sonner";

export function CreateTeamCard() {
  const [teamName, setTeamName] = useState("");
  const createTeam = useCreateTeam();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      await createTeam.mutateAsync(teamName.trim());
      toast.success("Team created successfully!");
      setTeamName("");
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Create Your Team
        </CardTitle>
        <CardDescription>
          Get started by creating a team. You can invite up to 5 team members to collaborate on audits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input
            placeholder="Enter team name..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!teamName.trim() || createTeam.isPending}>
            {createTeam.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
