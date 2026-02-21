import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SecurityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account security settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium mb-2">Password</h4>
            <p className="text-sm text-muted-foreground mb-3">Change your account password</p>
            <Button variant="outline" size="sm">Change Password</Button>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
            <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account</p>
            <Button variant="outline" size="sm" disabled>Coming Soon</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;
