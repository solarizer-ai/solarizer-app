import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, Check, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email || user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="flex items-center justify-between">
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
