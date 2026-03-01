import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Check, Zap, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

const SharingPage = () => {
  const navigate = useNavigate();
  const { canShareReports } = useFeatureAccess();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Sharing"
        subtitle="Manage report sharing settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Report Sharing</CardTitle>
          <CardDescription>
            {canShareReports
              ? "Share audit reports with collaborators directly from each report"
              : "Upgrade to Inferno to share reports with others"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canShareReports ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can share individual audit reports with collaborators by clicking the "Share" button on any report.
                Collaborators will receive an in-app invitation and can accept or decline.
              </p>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <ul className="space-y-2 text-sm text-foreground/90">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Share reports directly from the report page</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Collaborators get Inferno features on shared reports</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Comment on findings together</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Track remediation progress as a team</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <ul className="space-y-2 text-sm text-foreground/90">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Share audit reports with collaborators</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Collaborators get Inferno features on shared reports</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Comment on findings together</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Track remediation progress as a team</li>
                </ul>
              </div>
              <Button onClick={() => navigate("/pricing")} className="gap-2">
                <Zap className="w-4 h-4" />Upgrade to Inferno
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SharingPage;
