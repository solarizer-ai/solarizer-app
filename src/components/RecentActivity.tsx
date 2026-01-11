import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, AlertCircle, Clock, FileCode } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RecentActivity = () => {
  const { stats, isLoading } = useDashboardStats();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const { recentActivity } = stats;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secured':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'issues':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'analyzing':
        return <Clock className="w-4 h-4 text-warning animate-pulse" />;
      default:
        return <FileCode className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string, grade?: string) => {
    switch (status) {
      case 'secured':
        return `Secured${grade ? ` • Grade ${grade}` : ''}`;
      case 'issues':
        return `Issues found${grade ? ` • Grade ${grade}` : ''}`;
      case 'analyzing':
        return 'Analyzing...';
      default:
        return 'Pending';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          recentActivity.map((activity) => (
            <button
              key={activity.id}
              onClick={() => navigate(`/dashboard?audit=${activity.id}`)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.projectName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getStatusText(activity.status, activity.grade)} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
};
