import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateAudit } from "@/hooks/useAudits";
import type { AuditStatus } from "@/hooks/useAudits";
import { toast } from "sonner";

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface ScanState {
  isScanning: boolean;
  showWidget: boolean;
  currentAuditId: string | null;
  projectName: string;
  realtimeFindings: Finding[];
  realtimeAuditStatus: 'pending' | 'analyzing' | 'secured' | 'issues' | 'failed' | null;
}

interface ScanContextValue extends ScanState {
  startScan: (auditId: string, projectName: string) => void;
  cancelScan: () => Promise<void>;
  closeWidget: () => void;
}

const ScanContext = createContext<ScanContextValue | null>(null);

export const useScan = () => {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error("useScan must be used within a ScanProvider");
  }
  return context;
};

interface ScanProviderProps {
  children: ReactNode;
}

export const ScanProvider = ({ children }: ScanProviderProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [realtimeFindings, setRealtimeFindings] = useState<Finding[]>([]);
  const [realtimeAuditStatus, setRealtimeAuditStatus] = useState<'pending' | 'analyzing' | 'secured' | 'issues' | 'failed' | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const findingsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const auditChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const queryClient = useQueryClient();
  const updateAudit = useUpdateAudit();

  // Clean up channels
  const cleanupChannels = useCallback(() => {
    if (findingsChannelRef.current) {
      supabase.removeChannel(findingsChannelRef.current);
      findingsChannelRef.current = null;
    }
    if (auditChannelRef.current) {
      supabase.removeChannel(auditChannelRef.current);
      auditChannelRef.current = null;
    }
  }, []);

  // Set up realtime subscriptions when a scan starts
  useEffect(() => {
    if (!currentAuditId || !isScanning) return;

    // Set up findings channel
    const findingsChannel = supabase
      .channel(`findings-${currentAuditId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'findings',
          filter: `audit_id=eq.${currentAuditId}`,
        },
        (payload) => {
          console.log('Realtime finding received:', payload.new);
          const newFinding = payload.new as Finding;
          
          // Skip info severity findings for widget display
          if (newFinding.severity === 'info') return;
          
          setRealtimeFindings(prev => [...prev, {
            id: newFinding.id,
            title: newFinding.title,
            severity: newFinding.severity,
          }]);
          
          // Invalidate findings query to update the report view in real-time
          queryClient.invalidateQueries({ queryKey: ['findings', currentAuditId] });
        }
      )
      .subscribe();
    
    findingsChannelRef.current = findingsChannel;

    // Set up audit status channel
    const auditChannel = supabase
      .channel(`audit-${currentAuditId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audits',
          filter: `id=eq.${currentAuditId}`,
        },
        (payload) => {
          console.log('Realtime audit update received:', payload.new);
          const updatedAudit = payload.new as { status: 'pending' | 'analyzing' | 'secured' | 'issues' | 'failed' };
          setRealtimeAuditStatus(updatedAudit.status);
          
          // Invalidate audit query to update score/grade in report view
          queryClient.invalidateQueries({ queryKey: ['audit', currentAuditId] });
          
          // If audit is complete or failed, clean up but keep widget visible
          if (updatedAudit.status === 'secured' || updatedAudit.status === 'issues' || updatedAudit.status === 'failed') {
            cleanupChannels();
            setIsScanning(false);
            abortControllerRef.current = null;
            
            // Show failure notification if analysis failed
            if (updatedAudit.status === 'failed') {
              toast.error("Analysis Failed", {
                description: "Something went wrong. Your credits have been refunded.",
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();
    
    auditChannelRef.current = auditChannel;

    return () => {
      cleanupChannels();
    };
  }, [currentAuditId, isScanning, queryClient, cleanupChannels]);

  const startScan = useCallback((auditId: string, name: string) => {
    // Clean up any existing scan
    cleanupChannels();
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set state
    setCurrentAuditId(auditId);
    setProjectName(name);
    setIsScanning(true);
    setShowWidget(true);
    setRealtimeFindings([]);
    setRealtimeAuditStatus('analyzing');
    
    // Show toast
    toast.info("Security analysis started", {
      description: `Analyzing ${name}...`,
      duration: 4000,
    });
  }, [cleanupChannels]);

  const cancelScan = useCallback(async () => {
    // Abort the ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up channels
    cleanupChannels();

    // Update audit status to cancelled and lock it
    if (currentAuditId) {
      try {
        await updateAudit.mutateAsync({
          id: currentAuditId,
          status: "cancelled" as AuditStatus,
          is_locked: true,
        });
      } catch (e) {
        // Ignore errors when updating cancelled audit
      }
    }

    // Reset state
    setIsScanning(false);
    setCurrentAuditId(null);
    setProjectName("");
    setRealtimeFindings([]);
    setRealtimeAuditStatus(null);
    setShowWidget(false);

    toast.info("Analysis cancelled", {
      description: "Note: Credits used for this analysis have already been consumed.",
    });
  }, [currentAuditId, updateAudit, cleanupChannels]);

  const closeWidget = useCallback(() => {
    setShowWidget(false);
    // Reset state when closing completed scan
    if (!isScanning) {
      setCurrentAuditId(null);
      setProjectName("");
      setRealtimeFindings([]);
      setRealtimeAuditStatus(null);
    }
  }, [isScanning]);

  const value: ScanContextValue = {
    isScanning,
    showWidget,
    currentAuditId,
    projectName,
    realtimeFindings,
    realtimeAuditStatus,
    startScan,
    cancelScan,
    closeWidget,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
};
