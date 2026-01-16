import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const COLORS = {
  navy: [15, 23, 42], // Slate-900
  slate: [71, 85, 105], // Slate-600 (Secondary Text)
  border: [226, 232, 240], // Slate-200
  critical: [185, 28, 28], // Red-700
  high: [194, 65, 12], // Orange-700
  medium: [180, 83, 9], // Amber-700
  low: [29, 78, 216], // Blue-700
  info: [51, 65, 85], // Slate-700
  success: [21, 128, 61], // Green-700
};

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
  code_snippet?: string;
  line_start?: number;
}

interface AuditReport {
  project_name: string;
  grade: string;
  security_score: number;
  created_at: string;
  coverage_data?: {
    total_tests: number;
    passed: number;
    failed: number;
  };
  findings: Finding[];
}

const generatePdf = (audit: AuditReport): ArrayBuffer => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // --- 1. COVER PAGE ---
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text("SOLARIZER", margin, 100);
  doc.setFontSize(18);
  doc.text("Smart Contract Security Assessment", margin, 112);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(margin, 122, margin + 40, 122);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`PROJECT: ${audit.project_name.toUpperCase()}`, margin, 140);
  doc.text(
    `DATE: ${new Date(audit.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    margin,
    148,
  );

  // --- 2. EXECUTIVE SUMMARY ---
  doc.addPage();
  yPos = margin;
  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, yPos);
  yPos += 15;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 50, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate);
  doc.text("OVERALL SECURITY GRADE", margin + 10, yPos + 15);
  doc.setFontSize(40);
  doc.setTextColor(...COLORS.success);
  doc.text(audit.grade, margin + 10, yPos + 38);
  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(10);
  doc.text("SECURITY SCORE", pageWidth / 2, yPos + 15);
  doc.setFontSize(40);
  doc.text(`${audit.security_score}%`, pageWidth / 2, yPos + 38);
  yPos += 65;

  // --- 3. METHODOLOGY ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Methodology", margin, yPos);
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);
  const methodology =
    "This assessment utilizes a proprietary multi-layered verification pipeline. The process involves comprehensive structural mapping of contract dependencies, automated formal verification of state transitions, and a rigorous logical consistency review. Every finding is cross-referenced against an extensive repository of historical vulnerabilities and verified for contextual accuracy within the specific business logic of the protocol.";
  doc.text(doc.splitTextToSize(methodology, pageWidth - margin * 2), margin, yPos);
  yPos += 40;

  if (audit.coverage_data) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text("Verification Coverage", margin, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Total Logic Assertions: ${audit.coverage_data.total_tests}`, margin, yPos);
    doc.text(`Passed: ${audit.coverage_data.passed}`, margin + 60, yPos);
    doc.text(`Failed: ${audit.coverage_data.failed}`, margin + 100, yPos);
    yPos += 20;
  }

  // --- 4. DETAILED FINDINGS ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Security Findings", margin, yPos);
  yPos += 12;

  audit.findings.forEach((finding, i) => {
    checkPageBreak(70);
    const sColor = (COLORS as any)[finding.severity] || COLORS.info;

    // Header block
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, pageWidth - margin * 2, 12, "F");
    doc.setFillColor(...sColor);
    doc.rect(margin, yPos, 4, 12, "F");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navy);
    doc.text(`${i + 1}. ${finding.title}`, margin + 8, yPos + 8);
    doc.setFontSize(9);
    doc.text(finding.severity.toUpperCase(), pageWidth - margin - 5, yPos + 8, { align: "right" });
    yPos += 18;

    // Description
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slate);
    const descLines = doc.splitTextToSize(finding.description, pageWidth - margin * 2);
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 5 + 6;

    // Snippet Evidence
    if (finding.code_snippet) {
      checkPageBreak(30);
      doc.setFillColor(248, 250, 252);
      const snipLines = doc.splitTextToSize(finding.code_snippet, pageWidth - margin * 4);
      const snipHeight = snipLines.length * 4 + 12;
      doc.rect(margin, yPos, pageWidth - margin * 2, snipHeight, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.navy);
      doc.text(snipLines, margin + 5, yPos + 8);
      yPos += snipHeight + 10;
    }

    // Remediation
    if (finding.remediation) {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.success);
      doc.text("Proposed Mitigation:", margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.slate);
      const remLines = doc.splitTextToSize(finding.remediation, pageWidth - margin * 2);
      doc.text(remLines, margin, yPos);
      yPos += remLines.length * 5 + 15;
    }
  });

  // --- 5. LEGAL DISCLAIMER ---
  checkPageBreak(60);
  yPos += 10;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Legal Disclaimer", margin, yPos);
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);
  const disclaimer = [
    "This security assessment represents a point-in-time analysis of the smart contract source code provided at the time of the audit. While Solarizer utilizes advanced verification pipelines and industry-standard security patterns, a security audit is not a 100% guarantee of the absolute absence of vulnerabilities, bugs, or potential exploits.",
    "Security is an evolving field; new attack vectors or compiler-level issues may emerge after the issuance of this report. This assessment does not constitute an endorsement of the project's quality, financial viability, or investment potential. Solarizer and its associates are not liable for any financial losses, protocol hacks, or technical failures occurring after the completion of this audit.",
  ];
  disclaimer.forEach((p) => {
    const lines = doc.splitTextToSize(p, pageWidth - margin * 2);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4 + 4;
  });

  // Footer / Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text(
      `Solarizer Proprietary Security Assessment Report | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );
  }

  return doc.output("arraybuffer");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditId } = await req.json();

    if (!auditId) {
      return new Response(JSON.stringify({ error: "Audit ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: audit, error: auditError } = await supabase.from("audits").select("*").eq("id", auditId).single();

    if (auditError || !audit) {
      console.error("Audit fetch error:", auditError);
      return new Response(JSON.stringify({ error: "Audit not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      findings: (findings || []).map((f) => ({
        title: f.title,
        severity: f.severity,
        description: f.description,
        location: f.location,
        remediation: f.remediation,
      })),
    };

    const pdfBytes = generatePdf(reportData);
    const fileName = `${audit.project_name.replace(/[^a-zA-Z0-9]/g, "_")}_Security_Report.pdf`;

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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
