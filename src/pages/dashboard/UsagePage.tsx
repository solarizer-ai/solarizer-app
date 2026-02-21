import { DashboardStats } from "@/components/DashboardStats";
import { SecurityTrend } from "@/components/SecurityTrend";
import { SeverityBreakdown } from "@/components/SeverityBreakdown";

const UsagePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Usage Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your security analysis metrics
        </p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityBreakdown />
        <SecurityTrend />
      </div>
    </div>
  );
};

export default UsagePage;
