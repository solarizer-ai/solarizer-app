import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Send } from "lucide-react";
import { useInviteTeamMember } from "@/hooks/useTeam";
import { toast } from "sonner";

interface TeamInviteFormProps {
  teamId: string;
}

export function TeamInviteForm({ teamId }: TeamInviteFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const inviteMember = useInviteTeamMember();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await inviteMember.mutateAsync({ teamId, email: email.trim(), role });
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setRole('member');
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="w-4 h-4" />
          Invite Team Member
        </CardTitle>
        <CardDescription>
          Invite collaborators to share and work on audit reports together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={!email.trim() || inviteMember.isPending}>
            {inviteMember.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Invite
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Admins can invite and remove team members. Members have read-only access.
        </p>
      </CardContent>
    </Card>
  );
}
