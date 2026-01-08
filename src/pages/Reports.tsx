import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, Shield, Loader2 } from "lucide-react";
import { useAudits } from "@/hooks/useAudits";
import { formatDistanceToNow, format } from "date-fns";
import { downloadPdfReport } from "@/lib/pdfReport";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { data: audits, isLoading } = useAudits();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Only show completed audits (with grades) as reports
  const completedAudits = audits?.filter(audit => audit.grade !== null) || [];

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleDownloadPdf = async (auditId: string, projectName: string) => {
    setDownloadingId(auditId);
    try {
      await downloadPdfReport(auditId, projectName);
      toast({
        title: "Report ready",
        description: "Use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Please try again.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-success';
      case 'B': return 'text-success';
      case 'C': return 'text-warning';
      case 'D': return 'text-destructive';
      case 'F': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Security Reports</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Download and review your completed security audit reports
            </p>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : completedAudits.length > 0 ? (
            <div className="space-y-4">
              {completedAudits.map((audit) => (
                <Card key={audit.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{audit.project_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(audit.created_at), 'MMM d, yyyy')}
                            <span className="text-muted-foreground">•</span>
                            {formatTimestamp(audit.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className={`text-lg font-bold ${getGradeColor(audit.grade!)}`}>
                            {audit.grade}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({audit.security_score}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {audit.contract_count} contract{audit.contract_count !== 1 ? 's' : ''} analyzed
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/?audit=${audit.id}`)}
                        >
                          View Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={downloadingId === audit.id}
                          onClick={() => handleDownloadPdf(audit.id, audit.project_name)}
                        >
                          {downloadingId === audit.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No reports yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete your first audit to generate a security report
              </p>
              <Button onClick={() => navigate("/")} className="gap-2">
                Start New Audit
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
