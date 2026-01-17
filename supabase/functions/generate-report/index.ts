import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// Enhanced Color Palette - Obsidian & Solar Orange Theme
const COLORS = {
  // Obsidian blacks
  obsidian: [5, 5, 5], // Near black
  navy: [15, 23, 42], // Slate-900
  darkGray: [30, 30, 30], // Dark card background

  // Solar Orange (BRAND CORE)
  solarOrange: [253, 124, 41], // Primary brand
  solarGlow: [255, 153, 77], // Lighter variant
  solarDeep: [230, 107, 29], // Darker variant

  // Grayscale
  slate: [71, 85, 105], // Body text
  slateLight: [148, 163, 184], // Secondary text
  border: [226, 232, 240], // Dividers
  bgLight: [248, 250, 252], // Light backgrounds
  bgCard: [252, 252, 253], // Card backgrounds
  white: [255, 255, 255],

  // Severity colors
  critical: [220, 38, 38], // Brighter red
  high: [234, 88, 12], // Brighter orange
  medium: [234, 179, 8], // Brighter amber
  low: [59, 130, 246], // Brighter blue
  info: [100, 116, 139], // Slate
  success: [34, 197, 94], // Brighter green
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
  const margin = 22;
  let yPos = margin;

  // Utility: Check if page break needed
  const checkPageBreak = (needed: number) => {
    if (yPos + needed > pageHeight - 35) {
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
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slateLight);

    // Left: Solarizer mark
    doc.text("Solarizer", margin, pageHeight - 12);

    // Center: Report type
    doc.text("Confidential Security Assessment", pageWidth / 2, pageHeight - 12, { align: "center" });

    // Right: Page number
    doc.text(`${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: "right" });
  };

  // Utility: Draw severity badge
  const drawSeverityBadge = (severity: string, x: number, y: number, small = false) => {
    const sColor = (COLORS as any)[severity] || COLORS.info;
    const badgeWidth = small ? 45 : 60;
    const badgeHeight = small ? 14 : 18;

    doc.setFillColor(...sColor);
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 3, 3, "F");

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(small ? 8 : 9);
    doc.setFont("helvetica", "bold");
    doc.text(severity.toUpperCase(), x + badgeWidth / 2, y + (small ? 9.5 : 12), { align: "center" });
  };

  // Utility: Draw progress bar
  const drawProgressBar = (x: number, y: number, width: number, percentage: number, color: number[]) => {
    // Background
    doc.setFillColor(240, 240, 242);
    doc.roundedRect(x, y, width, 6, 2, 2, "F");

    // Progress
    if (percentage > 0) {
      doc.setFillColor(...color);
      const progressWidth = (width * percentage) / 100;
      doc.roundedRect(x, y, Math.max(progressWidth, 4), 6, 2, 2, "F");
    }
  };

  // Utility: Section header with orange accent
  const drawSectionHeader = (title: string, y: number, size = 20) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.navy);
    doc.text(title, margin, y);

    // Orange accent line
    doc.setDrawColor(...COLORS.solarOrange);
    doc.setLineWidth(2.5);
    const textWidth = doc.getTextWidth(title);
    doc.line(margin, y + 2, margin + Math.min(textWidth + 5, 70), y + 2);

    return y + 14;
  };

  // ==========================================
  // 1. COVER PAGE
  // ==========================================

  // Dark obsidian background
  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Solar Orange accent bar (left side)
  doc.setFillColor(...COLORS.solarOrange);
  doc.rect(0, 0, 6, pageHeight, "F");

  // Logo space (top-right)
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", pageWidth - 55, 22, 35, 35);
    } catch (e) {
      console.warn("Failed to add logo:", e);
    }
  } else {
    // Logo placeholder
    doc.setDrawColor(...COLORS.solarOrange);
    doc.setLineWidth(2);
    doc.rect(pageWidth - 55, 22, 35, 35, "S");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slateLight);
    doc.text("LOGO", pageWidth - 37.5, 42, { align: "center" });
  }

  // Main title - NOT ALL CAPS
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  doc.text("Solarizer", margin + 8, 95);

  // Subtitle with Solar Orange
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Smart Contract Security Assessment", margin + 8, 108);

  // Solar Orange decorative line
  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(2);
  doc.line(margin + 8, 115, margin + 75, 115);

  // Project details
  yPos = 135;
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PROJECT", margin + 8, yPos);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(audit.project_name.toUpperCase(), margin + 8, yPos + 8);

  yPos += 22;
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("ASSESSMENT DATE", margin + 8, yPos);

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(audit.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    margin + 8,
    yPos + 7,
  );

  // Confidential badge
  yPos += 25;
  doc.setFillColor(...COLORS.darkGray);
  doc.roundedRect(margin + 8, yPos, 75, 14, 3, 3, "F");
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("⚠  CONFIDENTIAL REPORT", margin + 45.5, yPos + 9.5, { align: "center" });

  // Footer tagline
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by AI-Driven Security Intelligence", pageWidth / 2, pageHeight - 18, { align: "center" });

  // ==========================================
  // 2. TABLE OF CONTENTS
  // ==========================================

  doc.addPage();
  yPos = margin + 5;

  yPos = drawSectionHeader("Table of Contents", yPos, 22);
  yPos += 8;

  const tocItems = [
    { title: "Executive Summary", page: 3 },
    { title: "Assessment Scope", page: 3 },
    { title: "Methodology", page: 3 },
    { title: "Security Findings Overview", page: 4 },
    { title: "Detailed Analysis", page: 5 },
    { title: "Test Coverage Results", page: "—" },
    { title: "Disclaimer", page: "—" },
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  tocItems.forEach((item, i) => {
    // Number
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.solarOrange);
    doc.text(`${i + 1}`, margin + 2, yPos);

    // Title
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.navy);
    doc.text(item.title, margin + 10, yPos);

    // Dots
    const titleWidth = doc.getTextWidth(item.title);
    const dotsX = margin + 10 + titleWidth + 3;
    const pageX = pageWidth - margin - 8;
    doc.setTextColor(...COLORS.border);
    doc.setFont("helvetica", "normal");
    doc.text("· ".repeat(Math.floor((pageX - dotsX) / 2)), dotsX, yPos);

    // Page number
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.slate);
    doc.text(String(item.page), pageWidth - margin, yPos, { align: "right" });

    yPos += 9;
  });

  addPageFooter(2);

  // ==========================================
  // 3. EXECUTIVE SUMMARY
  // ==========================================

  doc.addPage();
  yPos = margin + 5;

  yPos = drawSectionHeader("Executive Summary", yPos, 22);
  yPos += 5;

  // Modern score card with gradient-like effect
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 5, 5, "F");

  // Subtle border
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 55, 5, 5, "S");

  // Solar Orange top accent
  doc.setFillColor(...COLORS.solarOrange);
  doc.rect(margin, yPos, pageWidth - margin * 2, 3, "F");

  yPos += 18;

  // Left: Grade
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slateLight);
  doc.setFont("helvetica", "normal");
  doc.text("SECURITY GRADE", margin + 15, yPos);

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

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gradeColor);
  doc.text(audit.grade, margin + 15, yPos + 23);

  // Divider line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 8, yPos - 5, pageWidth / 2 - 8, yPos + 30);

  // Right: Score
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slateLight);
  doc.setFont("helvetica", "normal");
  doc.text("SECURITY SCORE", pageWidth / 2 + 8, yPos);

  doc.setFontSize(36);
  doc.setTextColor(...COLORS.solarOrange);
  doc.setFont("helvetica", "bold");
  doc.text(`${audit.security_score}%`, pageWidth / 2 + 8, yPos + 23);

  yPos += 45;

  // ==========================================
  // 4. AUDIT SCOPE
  // ==========================================

  checkPageBreak(45);
  yPos = drawSectionHeader("Assessment Scope", yPos, 16);
  yPos += 3;

  // Grid layout for scope items
  const scopeData = [
    { label: "Smart Contracts", value: audit.contract_count || "—", icon: "📄" },
    { label: "Lines of Code", value: audit.nloc_count?.toLocaleString() || "—", icon: "💻" },
    { label: "Security Tests", value: audit.coverage_data?.total_tests || "—", icon: "🔍" },
    {
      label: "Analysis Date",
      value: new Date(audit.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      icon: "📅",
    },
  ];

  const boxWidth = (pageWidth - margin * 2 - 6) / 2;
  const boxHeight = 22;
  let xOffset = 0;

  scopeData.forEach((item, i) => {
    if (i % 2 === 0) {
      xOffset = margin;
    } else {
      xOffset = margin + boxWidth + 6;
    }

    const boxY = yPos + Math.floor(i / 2) * (boxHeight + 4);

    // Card background
    doc.setFillColor(...COLORS.bgCard);
    doc.roundedRect(xOffset, boxY, boxWidth, boxHeight, 3, 3, "F");

    // Icon
    doc.setFontSize(14);
    doc.text(item.icon, xOffset + 8, boxY + 14);

    // Label
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slateLight);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), xOffset + 22, boxY + 10);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.navy);
    doc.setFont("helvetica", "bold");
    doc.text(String(item.value), xOffset + 22, boxY + 19);
  });

  yPos += Math.ceil(scopeData.length / 2) * (boxHeight + 4) + 8;

  // ==========================================
  // 5. METHODOLOGY
  // ==========================================

  checkPageBreak(55);
  yPos = drawSectionHeader("Methodology", yPos, 16);
  yPos += 3;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  const methodText =
    "This assessment leverages Solarizer's proprietary AI-powered verification engine, combining automated formal verification with deep logical analysis.";
  const methodLines = doc.splitTextToSize(methodText, pageWidth - margin * 2);
  doc.text(methodLines, margin, yPos);
  yPos += methodLines.length * 5 + 8;

  // Methodology points
  const methodPoints = [
    "Structural mapping of contract dependencies and call graphs",
    "Automated state transition verification against safety properties",
    "Pattern matching against 20,000+ historical vulnerability signatures",
    "Contextual validation within protocol-specific business logic",
    "Manual review of security-critical code paths",
  ];

  doc.setFontSize(9);
  methodPoints.forEach((point) => {
    // Orange bullet
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.solarOrange);
    doc.text("•", margin + 2, yPos);

    // Point text
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(point, pageWidth - margin * 2 - 10);
    doc.text(lines, margin + 8, yPos);
    yPos += lines.length * 5 + 1;
  });

  yPos += 8;

  // ==========================================
  // 6. FINDINGS OVERVIEW
  // ==========================================

  checkPageBreak(70);
  yPos = drawSectionHeader("Security Findings Overview", yPos, 16);
  yPos += 3;

  // Count findings by severity
  const severityCounts = {
    critical: audit.findings.filter((f) => f.severity === "critical").length,
    high: audit.findings.filter((f) => f.severity === "high").length,
    medium: audit.findings.filter((f) => f.severity === "medium").length,
    low: audit.findings.filter((f) => f.severity === "low").length,
    info: audit.findings.filter((f) => f.severity === "info").length,
  };

  const totalFindings = Object.values(severityCounts).reduce((a, b) => a + b, 0);

  if (totalFindings === 0) {
    // No findings - success message
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 4, 4, "F");

    doc.setTextColor(...COLORS.success);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("✓  No Security Issues Detected", pageWidth / 2, yPos + 15, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.slate);
    doc.text("All security verification tests passed successfully.", pageWidth / 2, yPos + 25, { align: "center" });

    yPos += 40;
  } else {
    // Visual breakdown
    const severityItems = [
      { name: "Critical", key: "critical", color: COLORS.critical },
      { name: "High", key: "high", color: COLORS.high },
      { name: "Medium", key: "medium", color: COLORS.medium },
      { name: "Low", key: "low", color: COLORS.low },
      { name: "Info", key: "info", color: COLORS.info },
    ];

    severityItems.forEach((item) => {
      const count = (severityCounts as any)[item.key];
      if (count === 0) return; // Skip if no findings

      const percentage = (count / totalFindings) * 100;

      // Badge
      drawSeverityBadge(item.key, margin, yPos - 3, true);

      // Label
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.navy);
      doc.text(item.name, margin + 50, yPos + 3);

      // Progress bar
      const barX = margin + 85;
      const barWidth = 65;
      drawProgressBar(barX, yPos - 1, barWidth, percentage, item.color);

      // Count
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...item.color);
      doc.text(String(count), barX + barWidth + 8, yPos + 3);

      yPos += 13;
    });

    yPos += 5;
  }

  // ==========================================
  // 7. DETAILED FINDINGS
  // ==========================================

  if (audit.findings.length > 0) {
    checkPageBreak(25);
    yPos = drawSectionHeader("Detailed Analysis", yPos, 18);
    yPos += 5;

    // Sort findings by severity
    const severityOrder: any = { critical: 1, high: 2, medium: 3, low: 4, info: 5 };
    const sortedFindings = [...audit.findings].sort(
      (a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99),
    );

    sortedFindings.forEach((finding, i) => {
      checkPageBreak(80);

      const sColor = (COLORS as any)[finding.severity] || COLORS.info;

      // Finding card
      doc.setFillColor(...COLORS.bgCard);
      const cardStartY = yPos;
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 16, 4, 4, "F");

      // Severity indicator (left bar)
      doc.setFillColor(...sColor);
      doc.rect(margin, yPos, 4, 16, "F");

      // Finding number
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.slateLight);
      doc.setFont("helvetica", "bold");
      doc.text(`#${i + 1}`, margin + 10, yPos + 10);

      // Title
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.navy);
      doc.setFont("helvetica", "bold");
      const titleText = finding.title.length > 75 ? finding.title.substring(0, 75) + "..." : finding.title;
      doc.text(titleText, margin + 20, yPos + 10);

      // Severity badge (right)
      drawSeverityBadge(finding.severity, pageWidth - margin - 48, yPos + 1, true);

      yPos += 22;

      // Location (if available)
      if (finding.location) {
        doc.setFillColor(248, 248, 249);
        doc.roundedRect(margin + 2, yPos, pageWidth - margin * 2 - 4, 9, 2, 2, "F");

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.slateLight);
        doc.setFont("helvetica", "normal");

        const locationText =
          finding.line_start && finding.line_end
            ? `📁 ${finding.location}  •  Lines ${finding.line_start}–${finding.line_end}`
            : `📁 ${finding.location}`;

        doc.text(locationText, margin + 6, yPos + 6.5);
        yPos += 13;
      }

      // Description
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.slate);
      const descLines = doc.splitTextToSize(finding.description, pageWidth - margin * 2 - 6);
      doc.text(descLines, margin + 3, yPos);
      yPos += descLines.length * 5 + 6;

      // Code snippet
      if (finding.code_snippet) {
        checkPageBreak(30);

        // Code header
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.slateLight);
        doc.setFont("helvetica", "bold");
        doc.text("AFFECTED CODE", margin + 3, yPos);
        yPos += 5;

        // Code box
        doc.setFillColor(250, 250, 251);
        const snipLines = doc.splitTextToSize(finding.code_snippet, pageWidth - margin * 2 - 12);
        const snipHeight = snipLines.length * 4.2 + 10;
        doc.roundedRect(margin + 2, yPos, pageWidth - margin * 2 - 4, snipHeight, 2, 2, "F");

        doc.setFont("courier", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.navy);
        doc.text(snipLines, margin + 6, yPos + 6);
        yPos += snipHeight + 8;
      }

      // Remediation
      if (finding.remediation) {
        checkPageBreak(25);

        // Remediation header
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.success);
        doc.setFontSize(9);
        doc.text("✓  Recommended Fix", margin + 3, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.slate);
        doc.setFontSize(9);
        const remLines = doc.splitTextToSize(finding.remediation, pageWidth - margin * 2 - 6);
        doc.text(remLines, margin + 3, yPos);
        yPos += remLines.length * 4.5 + 3;
      }

      // Subtle separator
      yPos += 5;
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
      yPos += 12;
    });
  }

  // ==========================================
  // 8. VERIFICATION COVERAGE
  // ==========================================

  if (audit.coverage_data) {
    checkPageBreak(55);

    yPos = drawSectionHeader("Test Coverage Results", yPos, 16);
    yPos += 3;

    // Summary card
    doc.setFillColor(...COLORS.bgCard);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 4, 4, "F");

    const passRate =
      audit.coverage_data.total_tests > 0
        ? ((audit.coverage_data.passed / audit.coverage_data.total_tests) * 100).toFixed(1)
        : "0.0";

    yPos += 12;

    // Stats layout
    const stats = [
      { label: "Total Tests", value: audit.coverage_data.total_tests, color: COLORS.navy },
      { label: "Passed", value: audit.coverage_data.passed, color: COLORS.success },
      { label: "Failed", value: audit.coverage_data.failed, color: COLORS.critical },
      { label: "Pass Rate", value: `${passRate}%`, color: COLORS.solarOrange },
    ];

    const statWidth = (pageWidth - margin * 2 - 15) / stats.length;

    stats.forEach((stat, i) => {
      const statX = margin + 5 + i * statWidth;

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slateLight);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label.toUpperCase(), statX, yPos);

      doc.setFontSize(15);
      doc.setTextColor(...stat.color);
      doc.setFont("helvetica", "bold");
      doc.text(String(stat.value), statX, yPos + 10);
    });

    yPos += 20;

    // Per-file breakdown
    if (audit.coverage_data.details && audit.coverage_data.details.length > 0) {
      checkPageBreak(35);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.navy);
      doc.text("Contract Breakdown", margin, yPos);
      yPos += 10;

      // Group by file
      const fileGroups: { [key: string]: CoverageDetail[] } = {};
      audit.coverage_data.details.forEach((detail) => {
        if (!fileGroups[detail.file]) {
          fileGroups[detail.file] = [];
        }
        fileGroups[detail.file].push(detail);
      });

      Object.keys(fileGroups)
        .slice(0, 5)
        .forEach((fileName) => {
          // Limit to 5 files
          checkPageBreak(15);

          const tests = fileGroups[fileName];
          const passed = tests.filter((t) => t.status === "PASSED").length;
          const total = tests.length;
          const filePassRate = total > 0 ? (passed / total) * 100 : 0;

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COLORS.navy);
          doc.text(`📄 ${fileName}`, margin + 2, yPos);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.slate);
          doc.text(`${passed}/${total} tests`, margin + 2 + doc.getTextWidth(`📄 ${fileName}`) + 5, yPos);

          // Progress bar
          const barWidth = 45;
          drawProgressBar(pageWidth - margin - barWidth - 2, yPos - 3.5, barWidth, filePassRate, COLORS.success);

          yPos += 10;
        });

      yPos += 5;
    }
  }

  // ==========================================
  // 9. LEGAL DISCLAIMER
  // ==========================================

  checkPageBreak(70);
  yPos += 8;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.navy);
  doc.text("Legal Disclaimer", margin, yPos);
  yPos += 10;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.slate);

  const disclaimer = [
    "This security assessment represents a point-in-time analysis of the smart contract source code provided. While Solarizer utilizes advanced AI-powered verification and industry-standard security patterns, no audit can guarantee the complete absence of vulnerabilities.",
    "",
    "Security is an evolving field. New attack vectors, compiler issues, or design flaws may emerge after this report's publication. This assessment does not constitute financial advice or an endorsement of the project's investment potential.",
    "",
    "Solarizer and its associates are not liable for any financial losses, exploits, or security incidents occurring post-audit. The project team retains full responsibility for implementing fixes and maintaining security.",
  ];

  disclaimer.forEach((para) => {
    if (para === "") {
      yPos += 3;
    } else {
      const lines = doc.splitTextToSize(para, pageWidth - margin * 2);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4.2 + 2;
    }
  });

  // ==========================================
  // 10. BACK COVER
  // ==========================================

  doc.addPage();

  // Dark background
  doc.setFillColor(...COLORS.obsidian);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Solar Orange accent bar (right side)
  doc.setFillColor(...COLORS.solarOrange);
  doc.rect(pageWidth - 6, 0, 6, pageHeight, "F");

  // Centered content
  const centerY = pageHeight / 2;

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Solarizer", pageWidth / 2, centerY - 25, { align: "center" });

  doc.setTextColor(...COLORS.solarOrange);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Security Intelligence", pageWidth / 2, centerY - 12, { align: "center" });

  // Divider
  doc.setDrawColor(...COLORS.solarOrange);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 35, centerY - 2, pageWidth / 2 + 35, centerY - 2);

  // Contact info
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(9);
  doc.text("For inquiries and support:", pageWidth / 2, centerY + 12, { align: "center" });

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.text("support@solarizer.io", pageWidth / 2, centerY + 23, { align: "center" });
  doc.text("https://solarizer.io", pageWidth / 2, centerY + 32, { align: "center" });

  // Timestamp
  doc.setTextColor(...COLORS.slateLight);
  doc.setFontSize(7.5);
  doc.text(
    `Report generated ${new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`,
    pageWidth / 2,
    pageHeight - 16,
    { align: "center" },
  );

  // ==========================================
  // FINALIZE: Add page numbers
  // ==========================================

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages - 1; i++) {
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
      .order("created_at", { ascending: true });

    if (findingsError) {
      console.error("Findings fetch error:", findingsError);
    }

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
    const fileName = `${audit.project_name.replace(/[^a-zA-Z0-9]/g, "_")}_Solarizer_Report.pdf`;

    console.log("✅ Generated professional PDF report:", auditId);

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
    console.error("❌ PDF generation error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
