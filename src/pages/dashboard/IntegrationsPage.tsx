import { GitHubIntegration } from "@/components/settings/GitHubIntegration";

const IntegrationsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect external services to enhance your workflow
        </p>
      </div>
      <GitHubIntegration />
    </div>
  );
};

export default IntegrationsPage;
