import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, UserPlus, X, Crown, Users, Clock, Check } from "lucide-react";
import { useAuditShares, useAddShare, useRemoveShare, useSearchUserByEmail } from "@/hooks/useAuditSharing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ShareAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  ownerEmail: string | null;
}

const ShareAuditModal = ({ open, onOpenChange, auditId, ownerEmail }: ShareAuditModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: shares, isLoading: sharesLoading } = useAuditShares(auditId);
  const addShare = useAddShare();
  const removeShare = useRemoveShare();
  const searchUser = useSearchUserByEmail();

  // Separate pending and accepted shares
  const pendingShares = shares?.filter(s => s.status === 'pending') || [];
  const acceptedShares = shares?.filter(s => s.status === 'accepted') || [];

  const handleAddShare = async () => {
    if (!email.trim()) return;

    setIsSearching(true);
    try {
      // First, search for the user by email
      const foundUser = await searchUser.mutateAsync(email.trim());

      if (!foundUser) {
        toast({
          variant: "destructive",
          title: "User not found",
          description: "No user exists with that email address. They need to sign up first.",
        });
        return;
      }

      if (foundUser.user_id === user?.id) {
        toast({
          variant: "destructive",
          title: "Cannot share with yourself",
          description: "You already own this audit.",
        });
        return;
      }

      // Check if already shared (pending or accepted)
      if (shares?.some(s => s.shared_with_user_id === foundUser.user_id)) {
        toast({
          variant: "destructive",
          title: "Already invited",
          description: "This user already has a pending invitation or access to this report.",
        });
        return;
      }

      // Add the share (creates pending invitation)
      await addShare.mutateAsync({
        auditId,
        sharedWithUserId: foundUser.user_id,
        sharedWithEmail: foundUser.email || email.trim(),
      });

      toast({
        title: "Invitation sent",
        description: `${foundUser.email || email.trim()} will receive an invitation to view this report.`,
      });

      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send invitation",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveShare = async (shareId: string, email: string, isPending: boolean) => {
    try {
      await removeShare.mutateAsync({ shareId, auditId });
      toast({
        title: isPending ? "Invitation cancelled" : "Access removed",
        description: `${email} ${isPending ? "will no longer receive the invitation" : "no longer has access"}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove",
        description: "Please try again.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddShare();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share Report
          </DialogTitle>
          <DialogDescription>
            Invite people to view this report. They'll receive an in-app invitation to accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add User Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              type="email"
              disabled={isSearching || addShare.isPending}
            />
            <Button 
              onClick={handleAddShare} 
              disabled={!email.trim() || isSearching || addShare.isPending}
              size="icon"
            >
              {isSearching || addShare.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Shared Users List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">People with access</p>
            
            <ScrollArea className="max-h-[250px]">
              <div className="space-y-2">
                {/* Owner */}
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{ownerEmail || "You"}</span>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Crown className="w-3 h-3" />
                      Owner
                    </Badge>
                  </div>
                </div>

                {/* Loading */}
                {sharesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Pending Invitations */}
                    {pendingShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 rounded-md bg-warning/10 border border-warning/20 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{share.shared_with_email}</span>
                          <Badge variant="outline" className="gap-1 text-xs text-warning border-warning/30">
                            <Clock className="w-3 h-3" />
                            Pending
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveShare(share.id, share.shared_with_email, true)}
                          disabled={removeShare.isPending}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Accepted Shares */}
                    {acceptedShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{share.shared_with_email}</span>
                          <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30">
                            <Check className="w-3 h-3" />
                            Viewer
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveShare(share.id, share.shared_with_email, false)}
                          disabled={removeShare.isPending}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {/* Empty State */}
                    {pendingShares.length === 0 && acceptedShares.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No one else has access yet
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAuditModal;
