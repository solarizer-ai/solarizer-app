import { Key } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ApiKeyManager } from "@/components/settings/ApiKeyManager";

const ApiKeysPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Key}
        title="API Keys"
        subtitle="Manage your API keys for CLI access"
      />
      <ApiKeyManager />
    </div>
  );
};

export default ApiKeysPage;
