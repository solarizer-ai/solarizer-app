import { CreditActivityLog } from "@/components/settings/CreditActivityLog";

const CreditActivityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Credit Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track your credit usage and transactions
        </p>
      </div>
      <CreditActivityLog />
    </div>
  );
};

export default CreditActivityPage;
