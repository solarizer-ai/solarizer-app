import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocsContent from "@/components/DocsContent";

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-24 pb-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Documentation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn how to use Solarizer for smart contract security analysis
            </p>
          </div>
          <DocsContent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Docs;
