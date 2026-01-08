import { supabase } from "@/integrations/supabase/client";

export const downloadPdfReport = async (auditId: string, projectName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("generate-report", {
      body: { auditId },
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
