import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/solarizer-logo.png";

// Helper to convert image to base64 data URL
const getLogoDataUrl = async (): Promise<string> => {
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Failed to load logo:", error);
    return "";
  }
};

export const downloadPdfReport = async (auditId: string, projectName: string) => {
  try {
    // Get logo as base64
    const logoDataUrl = await getLogoDataUrl();
    
    const { data, error } = await supabase.functions.invoke("generate-report", {
      body: { auditId, logoDataUrl },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Convert response to blob
    let blob: Blob;
    if (data instanceof Blob) {
      blob = data;
    } else if (data instanceof ArrayBuffer) {
      blob = new Blob([data], { type: "application/pdf" });
    } else {
      // If it's raw data, convert it
      const arrayBuffer = await new Response(data).arrayBuffer();
      blob = new Blob([arrayBuffer], { type: "application/pdf" });
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Security_Report.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { success: true };
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};
