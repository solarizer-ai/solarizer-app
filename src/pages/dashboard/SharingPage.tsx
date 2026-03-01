import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Check, Zap, Trash2, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useAllMyShares, useRemoveShare } from "@/hooks/useAuditSharing";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "accepted":
      return "default";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
};

const SharingPage = () => {
  const navigate = useNavigate();
  const { canShareReports } = useFeatureAccess();
  const { data: shares, isLoading } = useAllMyShares();
  const removeShare = useRemoveShare();
  const queryClient = useQueryClient();

  const handleRevoke = (shareId: string, auditId: string) => {
    removeShare.mutate(
      { shareId, auditId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["all-my-shares"] });
          toast.success("Share revoked successfully");
        },
        onError: () => toast.error("Failed to revoke share"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Sharing"
        subtitle="Manage report sharing settings"
      />

      {canShareReports ? (
        <>
          {/* Shared Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Shared Reports</CardTitle>
              <CardDescription>Reports you've shared with collaborators</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !shares || shares.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    You haven't shared any reports yet. Use the <strong>Share</strong> button on any report to invite collaborators.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Shared With</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shared On</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <Link
                            to={`/report/${share.audit_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {share.project_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {share.shared_with_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(share.status)}>
                            {share.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(share.invited_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(share.id, share.audit_id)}
                            disabled={removeShare.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle>About Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <ul className="space-y-2 text-sm text-foreground/90">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Share reports directly from the report page</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Collaborators get Inferno features on shared reports</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Comment on findings together</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" />Track remediation progress as a team</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Report Sharing</CardTitle>
            <CardDescription>Upgrade to Inferno to share reports with others</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SharingPage;
