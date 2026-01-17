import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// Enhanced Color Palette - Obsidian & Solar Orange Theme
const COLORS = {
  // Obsidian blacks
  obsidian: [5, 5, 5], // Near black (hsl(0 0% 2%))
  navy: [15, 23, 42], // Slate-900

  // Solar Orange (BRAND CORE)
  solarOrange: [253, 124, 41], // hsl(24 95% 53%)
  solarGlow: [255, 153, 77], // hsl(24 100% 60%)
  solarDeep: [230, 107, 29], // hsl(24 90% 45%)

  // Grayscale
  slate: [71, 85, 105], // Slate-600
  slateLight: [148, 163, 184], // Slate-400
  border: [226, 232, 240], // Slate-200
  bgLight: [248, 250, 252], // Slate-50
  white: [255, 255, 255],

  // Severity colors
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
  line_end?: number;
}

interface CoverageDetail {
  test_name: string;
  status: "PASSED" | "FAILED";
  proof: string | null;
  file: string;
  related_finding_title: string | null;
}

interface AuditReport {
  project_name: string;
  grade: string;
  security_score: number;
  created_at: string;
  nloc_count?: number;
  contract_count?: number;
  coverage_data?: {
    total_tests: number;
    passed: number;
    failed: number;
    details?: CoverageDetail[];
  };
  findings: Finding[];
}

const generatePdf = (audit: AuditReport, logoDataUrl?: string): ArrayBuffer => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Utility: Check if page break needed
  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 30) {
      doc.addPage();
      addPageFooter(doc.internal.getCurrentPageInfo().pageNumber);
      yPos = margin;
      return true;
    }
    return false;
  };

  // Utility: Add footer to page
  const addPageFooter = (pageNum: number) => {
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slateLight);
    doc.text(
      `Solarizer Proprietary Security Assessment Report | Page ${pageNum} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );
  };

  // Utility: Draw severity badge
  const drawSeverityBadge = (severity: string, x: number, y: number) => {
    const sColor = (COLORS as any)[severity] || COLORS.info;
    const badgeWidth = 55;
    const badgeHeight = 16;

    doc.setFillColor(...sColor);
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 2, 2, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(severity.toUpperCase(), x + badgeWidth / 2, y + 11, { align: "center" });
  };

  // Utility: Draw horizontal progress bar
  const drawProgressBar = (x: number, y: number, width: number, percentage: number, color: number[]) => {
    // Background
    doc.setFillColor(...COLORS.border);
    doc.roundedRect(x, y, width, 8, 2, 2, "F");

    // Progress
    if (percentage > 0) {
      doc.setFillColor(...color);
      doc.roundedRect(x, y, (width * percentage) / 100, 8, 2, 2, "F");
    }
  };

  // ==========================================
  // 1. COVER PAGE
  // ==========================================

  // Dark obsidian background
  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Solar Orange accent bar (left side)
  doc.setFillColor(...COLORS.solarOrange);
  doc.rect(0, 0, 8, pageHeight, "F");

  // Add logo space (if provided)
  if (logoDataUrl) {
    try {
      // Logo area: top-right corner
      doc.addImage(logoDataUrl, "PNG", pageWidth - 60, 20, 40, 40);
    } catch (e) {
      console.warn("Failed to add logo:", e);
    }
  } else {
    // Logo placeholder box (for design reference)
    doc.setDrawColor(...COLORS.solarOrange);
    doc.setLineWidth(2);
    doc.rect(pageWidth - 60, 20, 40, 40, "S");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slateLight);
    doc.text("LOGO", pageWidth - 40, 43, { align: "center" });
  }

  // Main title
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.text("SOLARIZER", margin + 10, 100);

  // Subtitle with Solar Orange
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(16);
  doc.text("SMART CONTRACT SECURITY ASSESSMENT", margin + 10, 115);

  // Solar Orange decorative line
  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(2);
  doc.line(margin + 10, 125, margin + 90, 125);

  // Project details
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`PROJECT:`, margin + 10, 145);
  doc.setFont("helvetica", "bold");
  doc.text(audit.project_name.toUpperCase(), margin + 38, 145);

  doc.setFont("helvetica", "normal");
  doc.text(`DATE:`, margin + 10, 155);
  doc.setFont("helvetica", "bold");
  doc.text(
    new Date(audit.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    margin + 33,
    155,
  );

  // Confidential badge
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin + 10, 170, 90, 18, 2, 2, "F");
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("⚠ CONFIDENTIAL REPORT", margin + 55, 181, { align: "center" });

  // Footer text
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by Solarizer AI Verification Engine", pageWidth / 2, pageHeight - 20, { align: "center" });

  // ==========================================
  // 2. TABLE OF CONTENTS
  // ==========================================

  doc.addPage();
  yPos = margin;

  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Table of Contents", margin, yPos);

  // Solar Orange underline
  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 3, margin + 65, yPos + 3);
  yPos += 20;

  const tocItems = [
    { title: "Executive Summary", page: 3 },
    { title: "Audit Scope", page: 3 },
    { title: "Methodology", page: 3 },
    { title: "Findings Overview", page: 4 },
    { title: "Detailed Findings", page: 5 },
    { title: "Verification Coverage", page: "N/A" },
    { title: "Legal Disclaimer", page: "N/A" },
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  tocItems.forEach((item, i) => {
    doc.text(`${i + 1}.`, margin, yPos);
    doc.text(item.title, margin + 10, yPos);
    doc.text(String(item.page), pageWidth - margin - 10, yPos, { align: "right" });
    yPos += 8;
  });

  addPageFooter(2);

  // ==========================================
  // 3. EXECUTIVE SUMMARY
  // ==========================================

  doc.addPage();
  yPos = margin;

  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, yPos);

  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(2);
  doc.line(margin, yPos + 3, margin + 75, yPos + 3);
  yPos += 20;

  // Score dashboard card
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 60, 4, 4, "F");

  // Solar Orange accent border
  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 60, 4, 4, "S");

  // Left side: Grade
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate);
  doc.setFont("helvetica", "normal");
  doc.text("OVERALL SECURITY GRADE", margin + 15, yPos + 18);

  doc.setFontSize(42);
  doc.setFont("helvetica", "bold");
  const gradeColor =
    audit.grade === "A"
      ? COLORS.success
      : audit.grade === "B"
        ? COLORS.low
        : audit.grade === "C"
          ? COLORS.medium
          : audit.grade === "D"
            ? COLORS.high
            : COLORS.critical;
  doc.setTextColor(...gradeColor);
  doc.text(audit.grade, margin + 15, yPos + 48);

  // Right side: Score
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate);
  doc.setFont("helvetica", "normal");
  doc.text("SECURITY SCORE", pageWidth / 2 + 10, yPos + 18);

  doc.setFontSize(42);
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFont("helvetica", "bold");
  doc.text(`${audit.security_score}%`, pageWidth / 2 + 10, yPos + 48);

  yPos += 75;

  // ==========================================
  // 4. AUDIT SCOPE
  // ==========================================

  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Audit Scope", margin, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  const scopeItems = [
    { label: "Contracts Analyzed", value: audit.contract_count || "N/A" },
    { label: "Lines of Code", value: audit.nloc_count?.toLocaleString() || "N/A" },
    { label: "Verification Tests", value: audit.coverage_data?.total_tests || "N/A" },
    { label: "Analysis Date", value: new Date(audit.created_at).toLocaleDateString() },
  ];

  scopeItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${item.label}:`, margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.value), margin + 60, yPos);
    yPos += 7;
  });

  yPos += 10;

  // ==========================================
  // 5. METHODOLOGY
  // ==========================================

  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Methodology", margin, yPos);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  const methodology = [
    "This assessment utilizes Solarizer's proprietary multi-layered verification pipeline combining automated formal verification with AI-powered logical consistency analysis.",
    "",
    "The analysis process includes:",
    "• Comprehensive structural mapping of contract dependencies",
    "• Automated state transition verification against safety properties",
    "• Cross-referencing against 20,000+ historical vulnerability patterns",
    "• Contextual validation within protocol-specific business logic",
    "• Manual review of critical security-sensitive code paths",
  ];

  methodology.forEach((line) => {
    if (line === "") {
      yPos += 4;
    } else {
      const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5;
    }
  });

  yPos += 10;

  // ==========================================
  // 6. FINDINGS OVERVIEW
  // ==========================================

  checkPageBreak(80);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Findings Overview", margin, yPos);
  yPos += 15;

  // Count findings by severity
  const severityCounts = {
    critical: audit.findings.filter((f) => f.severity === "critical").length,
    high: audit.findings.filter((f) => f.severity === "high").length,
    medium: audit.findings.filter((f) => f.severity === "medium").length,
    low: audit.findings.filter((f) => f.severity === "low").length,
    info: audit.findings.filter((f) => f.severity === "info").length,
  };

  const totalFindings = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  // Visual breakdown dashboard
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 70, 4, 4, "F");

  yPos += 15;

  const severityItems = [
    { name: "Critical", key: "critical", icon: "⚠", color: COLORS.critical },
    { name: "High", key: "high", icon: "🔶", color: COLORS.high },
    { name: "Medium", key: "medium", icon: "🟡", color: COLORS.medium },
    { name: "Low", key: "low", icon: "🔵", color: COLORS.low },
    { name: "Info", key: "info", icon: "ℹ", color: COLORS.info },
  ];

  severityItems.forEach((item) => {
    const count = (severityCounts as any)[item.key];
    const percentage = totalFindings > 0 ? (count / totalFindings) * 100 : 0;

    // Icon
    doc.setFontSize(12);
    doc.text(item.icon, margin + 10, yPos);

    // Label
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text(item.name, margin + 20, yPos);

    // Progress bar
    const barX = margin + 50;
    const barWidth = 80;
    drawProgressBar(barX, yPos - 5, barWidth, percentage, item.color);

    // Count
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...item.color);
    doc.text(String(count), barX + barWidth + 10, yPos);

    yPos += 11;
  });

  yPos += 10;

  // ==========================================
  // 7. DETAILED FINDINGS
  // ==========================================

  if (audit.findings.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text("Detailed Findings", margin, yPos);

    doc.setDrawColor(...COLORS.solarOrange);
    doc.setLineWidth(2);
    doc.line(margin, yPos + 3, margin + 60, yPos + 3);
    yPos += 18;

    // Sort findings by severity
    const severityOrder: any = { critical: 1, high: 2, medium: 3, low: 4, info: 5 };
    const sortedFindings = [...audit.findings].sort(
      (a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99),
    );

    sortedFindings.forEach((finding, i) => {
      checkPageBreak(90);

      const sColor = (COLORS as any)[finding.severity] || COLORS.info;

      // Header card
      doc.setFillColor(...COLORS.bgLight);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 3, 3, "F");

      // Left severity indicator bar
      doc.setFillColor(...sColor);
      doc.rect(margin, yPos, 5, 14, "F");

      // Finding number and title
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.navy);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${finding.title}`, margin + 10, yPos + 9);

      // Severity badge (top-right)
      drawSeverityBadge(finding.severity, pageWidth - margin - 58, yPos - 1);

      yPos += 20;

      // Location info (if available)
      if (finding.location) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, "F");

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.slate);
        doc.setFont("helvetica", "normal");

        const locationText =
          finding.line_start && finding.line_end
            ? `📁 ${finding.location} : Lines ${finding.line_start}-${finding.line_end}`
            : `📁 ${finding.location}`;

        doc.text(locationText, margin + 5, yPos + 7);
        yPos += 15;
      }

      // Description
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.slate);
      const descLines = doc.splitTextToSize(finding.description, pageWidth - margin * 2 - 4);
      doc.text(descLines, margin + 2, yPos);
      yPos += descLines.length * 5 + 8;

      // Code snippet (if available)
      if (finding.code_snippet) {
        checkPageBreak(35);

        doc.setFillColor(250, 250, 250);
        const snipLines = doc.splitTextToSize(finding.code_snippet, pageWidth - margin * 2 - 10);
        const snipHeight = snipLines.length * 4 + 14;
        doc.roundedRect(margin, yPos, pageWidth - margin * 2, snipHeight, 2, 2, "F");

        // "Code Evidence" label
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.slateLight);
        doc.setFont("helvetica", "bold");
        doc.text("CODE EVIDENCE", margin + 5, yPos + 8);

        doc.setFont("courier", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.navy);
        doc.text(snipLines, margin + 5, yPos + 14);
        yPos += snipHeight + 10;
      }

      // Remediation
      if (finding.remediation) {
        checkPageBreak(30);

        // Remediation header
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.success);
        doc.setFontSize(10);
        doc.text("✓ Proposed Mitigation:", margin, yPos);
        yPos += 7;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.slate);
        doc.setFontSize(9);
        const remLines = doc.splitTextToSize(finding.remediation, pageWidth - margin * 2 - 4);
        doc.text(remLines, margin + 2, yPos);
        yPos += remLines.length * 4.5 + 5;
      }

      // Separator line
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;
    });
  } else {
    // No findings - success message
    checkPageBreak(50);

    doc.setFillColor(...COLORS.success);
    doc.setFillColor(240, 253, 244); // Light green bg
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 4, 4, "F");

    doc.setTextColor(...COLORS.success);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("✓ No Security Issues Found", pageWidth / 2, yPos + 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("All verification tests passed successfully.", pageWidth / 2, yPos + 28, { align: "center" });

    yPos += 50;
  }

  // ==========================================
  // 8. VERIFICATION COVERAGE
  // ==========================================

  if (audit.coverage_data) {
    checkPageBreak(60);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text("Verification Coverage", margin, yPos);
    yPos += 15;

    // Summary stats
    doc.setFillColor(...COLORS.bgLight);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, "F");

    const passRate =
      audit.coverage_data.total_tests > 0
        ? ((audit.coverage_data.passed / audit.coverage_data.total_tests) * 100).toFixed(1)
        : "0";

    yPos += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slate);
    doc.text(`Total Logic Assertions:`, margin + 10, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(String(audit.coverage_data.total_tests), margin + 80, yPos);

    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Passed:`, margin + 10, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.success);
    doc.text(String(audit.coverage_data.passed), margin + 80, yPos);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slate);
    doc.text(`Failed:`, margin + 110, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.critical);
    doc.text(String(audit.coverage_data.failed), margin + 140, yPos);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slate);
    doc.text(`Pass Rate:`, pageWidth / 2 + 10, yPos);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.solarOrange);
    doc.text(`${passRate}%`, pageWidth / 2 + 45, yPos);

    yPos += 20;

    // Per-file breakdown (if details available)
    if (audit.coverage_data.details && audit.coverage_data.details.length > 0) {
      checkPageBreak(40);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.navy);
      doc.text("Per-Contract Test Results", margin, yPos);
      yPos += 10;

      // Group by file
      const fileGroups: { [key: string]: CoverageDetail[] } = {};
      audit.coverage_data.details.forEach((detail) => {
        if (!fileGroups[detail.file]) {
          fileGroups[detail.file] = [];
        }
        fileGroups[detail.file].push(detail);
      });

      Object.keys(fileGroups).forEach((fileName) => {
        checkPageBreak(20);

        const tests = fileGroups[fileName];
        const passed = tests.filter((t) => t.status === "PASSED").length;
        const failed = tests.filter((t) => t.status === "FAILED").length;
        const total = tests.length;
        const filePassRate = total > 0 ? (passed / total) * 100 : 0;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.navy);
        doc.text(`📄 ${fileName}`, margin, yPos);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.slate);
        doc.text(`${passed}/${total} tests passed`, margin + 60, yPos);

        // Mini progress bar
        const barWidth = 50;
        drawProgressBar(pageWidth - margin - barWidth - 5, yPos - 4, barWidth, filePassRate, COLORS.success);

        yPos += 8;
      });

      yPos += 10;
    }
  }

  // ==========================================
  // 9. LEGAL DISCLAIMER
  // ==========================================

  checkPageBreak(80);
  yPos += 5;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Legal Disclaimer", margin, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  const disclaimer = [
    "This security assessment represents a point-in-time analysis of the smart contract source code provided at the time of the audit. While Solarizer utilizes advanced AI-powered verification pipelines and industry-standard security patterns, a security audit is not a 100% guarantee of the absolute absence of vulnerabilities, bugs, or potential exploits.",
    "",
    "Security is an evolving field; new attack vectors, compiler-level issues, or protocol design flaws may emerge after the issuance of this report. This assessment does not constitute financial advice, an endorsement of the project's quality, investment potential, or legal compliance.",
    "",
    "Solarizer and its associates are not liable for any financial losses, protocol exploits, smart contract failures, or security incidents occurring after the completion of this audit. The responsibility for implementing recommended fixes and maintaining ongoing security practices lies solely with the project team.",
  ];

  disclaimer.forEach((para) => {
    if (para === "") {
      yPos += 3;
    } else {
      const lines = doc.splitTextToSize(para, pageWidth - margin * 2);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 3;
    }
  });

  // ==========================================
  // 10. BACK COVER
  // ==========================================

  doc.addPage();

  // Dark background
  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Solar Orange accent bar (right side for symmetry)
  doc.setFillColor(...COLORS.solarOrange);
  doc.rect(pageWidth - 8, 0, 8, pageHeight, "F");

  // Centered content
  const centerY = pageHeight / 2;

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("SOLARIZER", pageWidth / 2, centerY - 30, { align: "center" });

  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(14);
  doc.text("Powered by AI Verification Engine", pageWidth / 2, centerY - 15, { align: "center" });

  // Contact info
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("For inquiries, contact:", pageWidth / 2, centerY + 10, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.text("support@solarizer.io", pageWidth / 2, centerY + 20, { align: "center" });
  doc.text("https://solarizer.io", pageWidth / 2, centerY + 30, { align: "center" });

  // Timestamp
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(8);
  doc.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 20, { align: "center" });

  // ==========================================
  // FINALIZE: Add page numbers
  // ==========================================

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages - 1; i++) {
    // Skip cover (1) and back cover (last)
    doc.setPage(i);
    addPageFooter(i);
  }

  return doc.output("arraybuffer");
};

// ==========================================
// EDGE FUNCTION HANDLER
// ==========================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditId, logoDataUrl } = await req.json();

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

    // Fetch audit data
    const { data: audit, error: auditError } = await supabase.from("audits").select("*").eq("id", auditId).single();

    if (auditError || !audit) {
      console.error("Audit fetch error:", auditError);
      return new Response(JSON.stringify({ error: "Audit not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch findings
    const { data: findings, error: findingsError } = await supabase
      .from("findings")
      .select("*")
      .eq("audit_id", auditId)
      .order("created_at", { ascending: true });

    if (findingsError) {
      console.error("Findings fetch error:", findingsError);
    }

    // Build report data
    const reportData: AuditReport = {
      project_name: audit.project_name,
      grade: audit.grade || "N/A",
      security_score: audit.security_score || 0,
      created_at: audit.created_at,
      nloc_count: audit.nloc_count,
      contract_count: audit.contract_count,
      coverage_data: audit.coverage_data,
      findings: (findings || []).map((f) => ({
        title: f.title,
        severity: f.severity,
        description: f.description,
        location: f.location,
        remediation: f.remediation,
        code_snippet: f.code_snippet,
        line_start: f.line_start,
        line_end: f.line_end,
      })),
    };

    const pdfBytes = generatePdf(reportData, logoDataUrl);
    const fileName = `${audit.project_name.replace(/[^a-zA-Z0-9]/g, "_")}_Solarizer_Security_Report.pdf`;

    console.log("✅ Generated enhanced PDF report for audit:", auditId);

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
    console.error("❌ Error generating report:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
