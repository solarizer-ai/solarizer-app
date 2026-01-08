import { supabase } from "@/integrations/supabase/client";

export const downloadPdfReport = async (auditId: string, projectName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("generate-report", {
      body: { auditId },
    });

    if (error) {
      throw new Error(error.message);
    }

    // The response is HTML, open it in a new window for printing/saving as PDF
    const blob = new Blob([data], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for print-to-PDF
    const printWindow = window.open(url, "_blank");
    
    if (printWindow) {
      printWindow.onload = () => {
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    return { success: true };
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
};
