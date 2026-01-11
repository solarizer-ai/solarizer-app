import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, BookOpen, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAudits } from "@/hooks/useAudits";

interface QuickActionsProps {
  onNewAudit: () => void;
}

export const QuickActions = ({ onNewAudit }: QuickActionsProps) => {
  const navigate = useNavigate();
  const { data: audits } = useAudits();
  
  const hasCompletedAudits = audits?.some(a => a.status === 'secured' || a.status === 'issues');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={onNewAudit}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Run Analysis
        </Button>
        
        <Button
          onClick={() => navigate('/audits')}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <FileText className="w-4 h-4" />
          View History
        </Button>
        
        <Button
          onClick={() => navigate('/docs')}
          variant="outline"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <BookOpen className="w-4 h-4" />
          Documentation
        </Button>
        
        {hasCompletedAudits && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            size="sm"
            disabled
          >
            <Download className="w-4 h-4" />
            Export Reports
            <span className="text-xs ml-auto">(Coming Soon)</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
