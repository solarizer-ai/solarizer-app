import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, display_name: displayName, email: user.email }, { onConflict: "user_id" });
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, display_name: displayName } : null);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save", description: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Manage your personal information"
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName || "Avatar"} />}
              <AvatarFallback className="text-lg bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{displayName || "No name set"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile?.email || user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
