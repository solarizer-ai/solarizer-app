import DocsContent from "@/components/DocsContent";

const DocsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Documentation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Learn how to use Solarizer for smart contract security analysis
        </p>
      </div>
      <DocsContent />
    </div>
  );
};

export default DocsPage;
