import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Finding {
  title: string;
  severity: string;
  description: string;
  location: string | null;
  remediation: string | null;
}

interface AuditReport {
  project_name: string;
  grade: string;
  security_score: number;
  created_at: string;
  findings: Finding[];
}

const getSeverityLabel = (severity: string): string => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};

const generatePdf = (audit: AuditReport): ArrayBuffer => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const date = new Date(audit.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Solarizer Security Report", margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Smart Contract Security Audit", margin, yPos);
  
  doc.text(date, pageWidth - margin, yPos, { align: "right" });
  yPos += 15;

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // Project Overview Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(audit.project_name, margin + 10, yPos + 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("Security Assessment Summary", margin + 10, yPos + 25);

  // Grade circle
  const gradeX = pageWidth - margin - 25;
  const gradeY = yPos + 20;
  
  // Grade color
  let gradeColor: [number, number, number] = [34, 197, 94]; // green
  if (audit.grade === "C" || audit.grade === "D") {
    gradeColor = [234, 179, 8]; // yellow
  } else if (audit.grade === "F") {
    gradeColor = [239, 68, 68]; // red
  }
  
  doc.setDrawColor(...gradeColor);
  doc.setLineWidth(2);
  doc.circle(gradeX, gradeY, 12, "S");
  
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gradeColor);
  doc.text(audit.grade, gradeX, gradeY + 2, { align: "center" });
  
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Score: ${audit.security_score}%`, gradeX, gradeY + 18, { align: "center" });

  yPos += 55;

  // Vulnerability Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Vulnerability Summary", margin, yPos);
  yPos += 10;

  const severityCounts = {
    critical: audit.findings.filter(f => f.severity === 'critical').length,
    high: audit.findings.filter(f => f.severity === 'high').length,
    medium: audit.findings.filter(f => f.severity === 'medium').length,
    low: audit.findings.filter(f => f.severity === 'low').length,
    info: audit.findings.filter(f => f.severity === 'info').length,
  };

  const severities = [
    { name: "Critical", count: severityCounts.critical, color: [254, 242, 242] as [number, number, number], textColor: [220, 38, 38] as [number, number, number] },
    { name: "High", count: severityCounts.high, color: [255, 247, 237] as [number, number, number], textColor: [234, 88, 12] as [number, number, number] },
    { name: "Medium", count: severityCounts.medium, color: [255, 251, 235] as [number, number, number], textColor: [217, 119, 6] as [number, number, number] },
    { name: "Low", count: severityCounts.low, color: [239, 246, 255] as [number, number, number], textColor: [37, 99, 235] as [number, number, number] },
    { name: "Info", count: severityCounts.info, color: [249, 250, 251] as [number, number, number], textColor: [107, 114, 128] as [number, number, number] },
  ];

  const boxWidth = (pageWidth - 2 * margin - 4 * 8) / 5;
  let xPos = margin;

  severities.forEach((sev) => {
    doc.setFillColor(...sev.color);
    doc.roundedRect(xPos, yPos, boxWidth, 30, 2, 2, "F");
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...sev.textColor);
    doc.text(String(sev.count), xPos + boxWidth / 2, yPos + 15, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(sev.name, xPos + boxWidth / 2, yPos + 24, { align: "center" });
    
    xPos += boxWidth + 8;
  });

  yPos += 45;

  // Detailed Findings
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Detailed Findings", margin, yPos);
  yPos += 10;

  if (audit.findings.length === 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("No vulnerabilities found. Great job!", margin, yPos + 10);
  } else {
    audit.findings.forEach((finding, index) => {
      checkPageBreak(60);

      // Finding box
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      
      // Severity badge
      let badgeColor: [number, number, number] = [107, 114, 128];
      if (finding.severity === 'critical') badgeColor = [220, 38, 38];
      else if (finding.severity === 'high') badgeColor = [234, 88, 12];
      else if (finding.severity === 'medium') badgeColor = [217, 119, 6];
      else if (finding.severity === 'low') badgeColor = [37, 99, 235];

      doc.setFillColor(...badgeColor);
      doc.roundedRect(margin, yPos, 45, 6, 1, 1, "F");
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(getSeverityLabel(finding.severity).toUpperCase(), margin + 22.5, yPos + 4.5, { align: "center" });

      // Title
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(finding.title, margin + 50, yPos + 4.5);
      yPos += 12;

      // Location
      if (finding.location) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(`Location: ${finding.location}`, margin, yPos);
        yPos += 6;
      }

      // Description
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      const descLines = doc.splitTextToSize(finding.description, pageWidth - 2 * margin);
      doc.text(descLines, margin, yPos);
      yPos += descLines.length * 4 + 4;

      // Remediation
      if (finding.remediation) {
        checkPageBreak(25);
        
        doc.setFillColor(240, 253, 244);
        const remLines = doc.splitTextToSize(finding.remediation, pageWidth - 2 * margin - 10);
        const remHeight = remLines.length * 4 + 10;
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, remHeight, 2, 2, "F");
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text("Remediation", margin + 5, yPos + 6);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(remLines, margin + 5, yPos + 12);
        yPos += remHeight + 8;
      }

      yPos += 5;
    });
  }

  // Footer
  checkPageBreak(30);
  yPos = pageHeight - 25;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text("Generated by Solarizer Smart Contract Security Platform", pageWidth / 2, yPos, { align: "center" });
  doc.text(`Report generated on ${date}`, pageWidth / 2, yPos + 5, { align: "center" });

  return doc.output("arraybuffer") as ArrayBuffer;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditId } = await req.json();
    
    if (!auditId) {
      return new Response(
        JSON.stringify({ error: "Audit ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .single();

    if (auditError || !audit) {
      console.error("Audit fetch error:", auditError);
      return new Response(
        JSON.stringify({ error: "Audit not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: findings, error: findingsError } = await supabase
      .from("findings")
      .select("*")
      .eq("audit_id", auditId)
      .order("severity", { ascending: true });

    if (findingsError) {
      console.error("Findings fetch error:", findingsError);
    }

    const reportData: AuditReport = {
      project_name: audit.project_name,
      grade: audit.grade || "N/A",
      security_score: audit.security_score || 0,
      created_at: audit.created_at,
      findings: (findings || []).map(f => ({
        title: f.title,
        severity: f.severity,
        description: f.description,
        location: f.location,
        remediation: f.remediation,
      })),
    };

    const pdfBytes = generatePdf(reportData);
    const fileName = `${audit.project_name.replace(/[^a-zA-Z0-9]/g, '_')}_Security_Report.pdf`;

    console.log("Generated PDF report for audit:", auditId);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
