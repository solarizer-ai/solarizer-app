import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SecurityPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Email sent", description: "Check your inbox for the password reset link." });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to send email", description: "Please try again." });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="Security"
        subtitle="Manage your account security settings"
      />

      <div className="grid gap-4">
        {/* Password Reset */}
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">Reset your account password via email</p>
              </div>
            </div>
            {resetSent ? (
              <div className="flex items-center gap-2 text-sm text-primary shrink-0">
                <CheckCircle2 className="h-4 w-4" />
                Email Sent
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={resetting} className="shrink-0">
                {resetting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Reset Password
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 2FA — Coming Soon */}
        <Card className="opacity-60">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-muted">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled className="shrink-0">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPage;
