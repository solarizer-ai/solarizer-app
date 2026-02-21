import { ApiKeyManager } from "@/components/settings/ApiKeyManager";

const ApiKeysPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">API Keys</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your API keys for CLI access
        </p>
      </div>
      <ApiKeyManager />
    </div>
  );
};

export default ApiKeysPage;
