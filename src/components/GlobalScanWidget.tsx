import { useNavigate } from "react-router-dom";
import { useScan } from "@/contexts/ScanContext";
import ScanProgressWidget from "@/components/ScanProgressWidget";

const GlobalScanWidget = () => {
  const navigate = useNavigate();
  const { 
    showWidget, 
    projectName, 
    realtimeFindings, 
    realtimeAuditStatus,
    currentAuditId,
    cancelScan,
    closeWidget,
  } = useScan();

  const handleViewResults = () => {
    if (currentAuditId) {
      navigate(`/reports/${currentAuditId}`);
      closeWidget();
    }
  };

  // Map findings to expected format (exclude 'info' as already filtered)
  const mappedFindings = realtimeFindings
    .filter(f => f.severity !== 'info')
    .map(f => ({
      id: f.id,
      title: f.title,
      severity: f.severity as 'critical' | 'high' | 'medium' | 'low' | 'info',
    }));

  return (
    <ScanProgressWidget
      isVisible={showWidget}
      projectName={projectName}
      findings={mappedFindings}
      auditStatus={realtimeAuditStatus}
      onCancel={cancelScan}
      onViewResults={handleViewResults}
      onClose={closeWidget}
    />
  );
};

export default GlobalScanWidget;
