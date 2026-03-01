import { Plug } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GitHubIntegration } from "@/components/settings/GitHubIntegration";

const IntegrationsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Plug}
        title="Integrations"
        subtitle="Connect external services to enhance your workflow"
      />
      <GitHubIntegration />
    </div>
  );
};

export default IntegrationsPage;
