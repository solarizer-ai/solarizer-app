import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ScanState {
  isScanning: boolean;
  currentAuditId: string | null;
  projectName: string;
}

interface ScanContextValue extends ScanState {
  startScan: (auditId: string, projectName: string) => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) throw new Error("useScan must be used within a ScanProvider");
  return context;
};

export const ScanProvider = ({ children }: { children: ReactNode }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  const findingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const auditChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const queryClient = useQueryClient();

  const cleanupChannels = useCallback(() => {
    if (findingsChannelRef.current) { supabase.removeChannel(findingsChannelRef.current); findingsChannelRef.current = null; }
    if (auditChannelRef.current) { supabase.removeChannel(auditChannelRef.current); auditChannelRef.current = null; }
  }, []);

  useEffect(() => {
    if (!currentAuditId || !isScanning) return;

    const findingsChannel = supabase
      .channel(`findings-${currentAuditId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'findings', filter: `audit_id=eq.${currentAuditId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['findings', currentAuditId] });
      }).subscribe();
    findingsChannelRef.current = findingsChannel;

    const auditChannel = supabase
      .channel(`audit-${currentAuditId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits', filter: `id=eq.${currentAuditId}` }, (payload) => {
        const updatedAudit = payload.new as { status: string };
        queryClient.invalidateQueries({ queryKey: ['audit', currentAuditId] });
        if (['secured', 'issues', 'failed'].includes(updatedAudit.status)) {
          cleanupChannels();
          setIsScanning(false);
          if (updatedAudit.status === 'failed') toast.error("Analysis Failed", { description: "Something went wrong. If credits were charged, they will be refunded.", duration: 8000 });
        }
      }).subscribe();
    auditChannelRef.current = auditChannel;

    return () => { cleanupChannels(); };
  }, [currentAuditId, isScanning, queryClient, cleanupChannels]);

  const startScan = useCallback((auditId: string, name: string) => {
    cleanupChannels();
    setCurrentAuditId(auditId);
    setProjectName(name);
    setIsScanning(true);
    toast.info("Security analysis started", { description: `Analyzing ${name}...`, duration: 4000 });
  }, [cleanupChannels]);

  return (
    <ScanContext.Provider value={{ isScanning, currentAuditId, projectName, startScan }}>
      {children}
    </ScanContext.Provider>
  );
};
