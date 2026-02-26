import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateAudit } from "@/hooks/useAudits";
import type { AuditStatus } from "@/hooks/useAudits";
import { toast } from "sonner";

interface Finding { id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; }

interface OrchestrationProgress {
  currentContract?: string;
  contractIndex?: number;
  contractTotal?: number;
  subPhase?: string;
}

interface ScanState {
  isScanning: boolean; showWidget: boolean; currentAuditId: string | null; projectName: string;
  realtimeFindings: Finding[];
  realtimeAuditStatus: 'pending' | 'analyzing' | 'secured' | 'issues' | 'failed' | null;
  orchestrationPhase: string | null;
  orchestrationProgress: OrchestrationProgress | null;
}

interface ScanContextValue extends ScanState {
  startScan: (auditId: string, projectName: string) => void;
  cancelScan: () => Promise<void>;
  closeWidget: () => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) throw new Error("useScan must be used within a ScanProvider");
  return context;
};

export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [realtimeFindings, setRealtimeFindings] = useState<Finding[]>([]);
  const [realtimeAuditStatus, setRealtimeAuditStatus] = useState<ScanState['realtimeAuditStatus']>(null);
  const [orchestrationPhase, setOrchestrationPhase] = useState<string | null>(null);
  const [orchestrationProgress, setOrchestrationProgress] = useState<OrchestrationProgress | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const findingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const auditChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const orchestrationChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryClient = useQueryClient();
  const updateAudit = useUpdateAudit();

  const cleanupChannels = useCallback(() => {
    if (findingsChannelRef.current) { supabase.removeChannel(findingsChannelRef.current); findingsChannelRef.current = null; }
    if (auditChannelRef.current) { supabase.removeChannel(auditChannelRef.current); auditChannelRef.current = null; }
    if (orchestrationChannelRef.current) { supabase.removeChannel(orchestrationChannelRef.current); orchestrationChannelRef.current = null; }
  }, []);

  useEffect(() => {
    if (!currentAuditId || !isScanning) return;

    const findingsChannel = supabase
      .channel(`findings-${currentAuditId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'findings', filter: `audit_id=eq.${currentAuditId}` }, (payload) => {
        const newFinding = payload.new as Finding;
        if (newFinding.severity === 'info') return;
        setRealtimeFindings(prev => [...prev, { id: newFinding.id, title: newFinding.title, severity: newFinding.severity }]);
        queryClient.invalidateQueries({ queryKey: ['findings', currentAuditId] });
      }).subscribe();
    findingsChannelRef.current = findingsChannel;

    const auditChannel = supabase
      .channel(`audit-${currentAuditId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits', filter: `id=eq.${currentAuditId}` }, (payload) => {
        const updatedAudit = payload.new as { status: ScanState['realtimeAuditStatus'] };
        setRealtimeAuditStatus(updatedAudit.status);
        queryClient.invalidateQueries({ queryKey: ['audit', currentAuditId] });
        if (updatedAudit.status === 'secured' || updatedAudit.status === 'issues' || updatedAudit.status === 'failed') {
          cleanupChannels();
          setIsScanning(false);
          abortControllerRef.current = null;
          if (updatedAudit.status === 'failed') toast.error("Analysis Failed", { description: "Something went wrong. Your credits have been refunded.", duration: 8000 });
        }
      }).subscribe();
    auditChannelRef.current = auditChannel;

    const orchestrationChannel = supabase
      .channel(`orchestration-${currentAuditId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audit_orchestration', filter: `session_id=eq.${currentAuditId}` }, (payload) => {
        const row = payload.new as { phase?: string; progress?: OrchestrationProgress };
        setOrchestrationPhase(row.phase ?? null);
        setOrchestrationProgress(row.progress ?? null);
      }).subscribe();
    orchestrationChannelRef.current = orchestrationChannel;

    return () => { cleanupChannels(); };
  }, [currentAuditId, isScanning, queryClient, cleanupChannels]);

  const startScan = useCallback((auditId: string, name: string) => {
    cleanupChannels();
    abortControllerRef.current = new AbortController();
    setCurrentAuditId(auditId); setProjectName(name); setIsScanning(true); setShowWidget(true);
    setRealtimeFindings([]); setRealtimeAuditStatus('analyzing');
    setOrchestrationPhase('queued'); setOrchestrationProgress(null);
    toast.info("Security analysis started", { description: `Analyzing ${name}...`, duration: 4000 });
  }, [cleanupChannels]);

  const cancelScan = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cleanupChannels();
    if (currentAuditId) {
      try { await updateAudit.mutateAsync({ id: currentAuditId, status: "cancelled" as AuditStatus, is_locked: true }); queryClient.invalidateQueries({ queryKey: ['audits'] }); } catch {}
    }
    setIsScanning(false); setCurrentAuditId(null); setProjectName(""); setRealtimeFindings([]); setRealtimeAuditStatus(null); setShowWidget(false);
    setOrchestrationPhase(null); setOrchestrationProgress(null);
    toast.info("Analysis cancelled", { description: "Note: Credits used for this analysis have already been consumed." });
  }, [currentAuditId, updateAudit, cleanupChannels, queryClient]);

  const closeWidget = useCallback(() => {
    setShowWidget(false);
    if (!isScanning) { setCurrentAuditId(null); setProjectName(""); setRealtimeFindings([]); setRealtimeAuditStatus(null); setOrchestrationPhase(null); setOrchestrationProgress(null); }
  }, [isScanning]);

  return (
    <ScanContext.Provider value={{ isScanning, showWidget, currentAuditId, projectName, realtimeFindings, realtimeAuditStatus, orchestrationPhase, orchestrationProgress, startScan, cancelScan, closeWidget }}>
      {children}
    </ScanContext.Provider>
  );
};
