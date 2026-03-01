import { Coins } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CreditActivityLog } from "@/components/settings/CreditActivityLog";

const CreditActivityPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Coins}
        title="Credit Activity"
        subtitle="Track your credit usage and transactions"
      />
      <CreditActivityLog />
    </div>
  );
};

export default CreditActivityPage;
