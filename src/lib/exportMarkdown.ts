import type { Audit, Finding } from "@/hooks/useAudits";

interface VulnerabilityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

interface ExportOptions {
  audit: Audit;
  findings: Finding[];
  vulnerabilityCounts: VulnerabilityCounts;
}

export const generateMarkdownReport = (options: ExportOptions): string => {
  const { audit, findings, vulnerabilityCounts } = options;
  const date = new Date(audit.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalFindings = Object.values(vulnerabilityCounts).reduce((a, b) => a + b, 0);

  // Calculate pass rate if coverage data exists
  const passRate = audit.coverage_data?.total_tests
    ? ((audit.coverage_data.passed / audit.coverage_data.total_tests) * 100).toFixed(1)
    : null;

  let markdown = `# Solarizer Security Analysis

> **Smart Contract Security Analysis Report**

---

## 📋 Executive Summary

<div align="center">

### Security Grade: **${audit.grade || "N/A"}** | Security Score: **${audit.security_score ?? "--"}%**

</div>

| Metric | Value |
|--------|-------|
| **Project Name** | ${audit.project_name} |
| **Assessment Date** | ${date} |
| **Contracts Analyzed** | ${audit.contract_count} |
| **Lines of Code** | ${audit.nloc_count?.toLocaleString() ?? "N/A"} |
${audit.coverage_data?.total_tests ? `| **Verification Tests** | ${audit.coverage_data.total_tests} |` : ""}
${passRate ? `| **Test Pass Rate** | ${passRate}% |` : ""}

---

## 🎯 Assessment Scope

This comprehensive security assessment analyzed **${audit.contract_count}** smart contract${audit.contract_count !== 1 ? "s" : ""} containing ${audit.nloc_count ? `**${audit.nloc_count.toLocaleString()}**` : "an undisclosed number of"} lines of Solidity code.

### Methodology

The assessment utilized Solarizer's proprietary AI-powered verification engine, combining:

- ✅ **Structural Dependency Mapping** – Analysis of contract interactions and call graphs
- ✅ **Automated State Verification** – Formal verification of state transitions
- ✅ **Pattern Matching** – Cross-referencing against 20,000+ historical vulnerabilities
- ✅ **Contextual Logic Analysis** – Protocol-specific business logic validation
- ✅ **Manual Review** – Expert examination of security-critical code paths

---

## 📊 Findings Overview

`;

  // Findings breakdown table
  if (totalFindings > 0) {
    markdown += `| Severity | Count | Status |\n`;
    markdown += `|----------|-------|--------|\n`;

    const severityData = [
      { level: "Critical", key: "critical", emoji: "🔴", count: vulnerabilityCounts.critical },
      { level: "High", key: "high", emoji: "🟠", count: vulnerabilityCounts.high },
      { level: "Medium", key: "medium", emoji: "🟡", count: vulnerabilityCounts.medium },
      { level: "Low", key: "low", emoji: "🔵", count: vulnerabilityCounts.low },
      { level: "Info", key: "info", emoji: "⚪", count: vulnerabilityCounts.info },
    ];

    severityData.forEach(({ level, emoji, count }) => {
      const bar = count > 0 ? "█".repeat(Math.min(count, 10)) : "—";
      markdown += `| ${emoji} **${level}** | **${count}** | ${bar} |\n`;
    });

    markdown += `| **Total Issues** | **${totalFindings}** | |\n\n`;
  } else {
    markdown += `### ✅ No Security Issues Detected

All security verification tests passed successfully. The analyzed contracts demonstrate strong security posture with no identified vulnerabilities.

`;
  }

  markdown += `---

## 🔍 Detailed Analysis

`;

  // Group findings by severity
  const severityOrder: Array<"critical" | "high" | "medium" | "low" | "info"> = [
    "critical",
    "high",
    "medium",
    "low",
    "info",
  ];
  const severityEmoji: Record<string, string> = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🔵",
    info: "⚪",
  };

  const severityDescriptions: Record<string, string> = {
    critical: "Immediate action required - Funds or contract integrity at risk",
    high: "Urgent attention needed - Significant security implications",
    medium: "Should be addressed - Moderate security impact",
    low: "Recommended fix - Minor security concerns",
    info: "Informational - Best practice improvements",
  };

  let findingNumber = 0;

  severityOrder.forEach((severity) => {
    const severityFindings = findings.filter((f) => f.severity === severity);
    if (severityFindings.length > 0) {
      markdown += `### ${severityEmoji[severity]} ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity\n\n`;
      markdown += `> *${severityDescriptions[severity]}*\n\n`;
      markdown += `**${severityFindings.length} issue${severityFindings.length !== 1 ? "s" : ""} identified**\n\n`;
      markdown += `---\n\n`;

      severityFindings.forEach((finding) => {
        findingNumber++;

        // Finding header
        markdown += `#### Finding #${findingNumber}: ${finding.title}\n\n`;

        // Location badge
        if (finding.location) {
          const lines =
            finding.line_start && finding.line_end
              ? finding.line_start === finding.line_end
                ? ` · Line ${finding.line_start}`
                : ` · Lines ${finding.line_start}–${finding.line_end}`
              : "";
          markdown += `> 📁 **Location:** \`${finding.location}\`${lines}\n\n`;
        }

        // Description
        markdown += `**Description:**\n\n${finding.description}\n\n`;

        // Code snippet
        if (finding.code_snippet) {
          markdown += `<details>\n<summary><strong>📝 View Affected Code</strong></summary>\n\n`;
          markdown += `\`\`\`solidity\n${finding.code_snippet}\n\`\`\`\n\n`;
          markdown += `</details>\n\n`;
        }

        // Remediation
        if (finding.remediation) {
          markdown += `**✅ Recommended Fix:**\n\n`;
          markdown += `${finding.remediation}\n\n`;
        }

        markdown += `---\n\n`;
      });
    }
  });

  if (findings.length === 0) {
    markdown += `### ✅ Clean Security Assessment

No security vulnerabilities, bugs, or issues were identified during the analysis of the provided smart contracts. The codebase demonstrates:

- ✓ Proper implementation of security best practices
- ✓ No critical or high-severity vulnerabilities detected  
- ✓ Secure handling of state transitions and external calls
- ✓ Appropriate access control mechanisms

**Note:** This represents a point-in-time analysis. Continuous security monitoring is recommended.

---

`;
  }

  // Test Coverage Section (if available)
  if (audit.coverage_data && audit.coverage_data.total_tests > 0) {
    markdown += `## 🧪 Verification Coverage\n\n`;
    markdown += `The assessment included **${audit.coverage_data.total_tests}** automated security verification tests:\n\n`;
    markdown += `| Status | Count | Percentage |\n`;
    markdown += `|--------|-------|------------|\n`;
    markdown += `| ✅ Passed | ${audit.coverage_data.passed} | ${passRate}% |\n`;
    markdown += `| ❌ Failed | ${audit.coverage_data.failed} | ${((audit.coverage_data.failed / audit.coverage_data.total_tests) * 100).toFixed(1)}% |\n\n`;

    // Per-contract breakdown (if available)
    if (audit.coverage_data.details && audit.coverage_data.details.length > 0) {
      const fileGroups: { [key: string]: any[] } = {};
      audit.coverage_data.details.forEach((detail) => {
        if (!fileGroups[detail.file]) {
          fileGroups[detail.file] = [];
        }
        fileGroups[detail.file].push(detail);
      });

      if (Object.keys(fileGroups).length > 0) {
        markdown += `### Per-Contract Results\n\n`;

        Object.keys(fileGroups).forEach((fileName) => {
          const tests = fileGroups[fileName];
          const passed = tests.filter((t: any) => t.status === "PASSED").length;
          const total = tests.length;
          const rate = ((passed / total) * 100).toFixed(0);

          markdown += `- **${fileName}**: ${passed}/${total} tests passed (${rate}%)\n`;
        });

        markdown += `\n`;
      }
    }

    markdown += `---\n\n`;
  }

  // Footer
  const generatedDate = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  markdown += `## ⚖️ Legal Disclaimer

This security assessment represents a point-in-time analysis of the smart contract source code provided. While Solarizer utilizes advanced AI-powered verification pipelines and industry-standard security patterns, no audit can guarantee the complete absence of vulnerabilities.

**Key Points:**

- 🔒 Security is an evolving field; new attack vectors may emerge
- 📋 This report does not constitute financial or legal advice
- 🛡️ The project team retains full responsibility for security implementation
- ⚠️ Solarizer is not liable for post-audit security incidents

**Recommendation:** Conduct ongoing security monitoring and consider periodic re-assessments as the protocol evolves.

---

## 📞 Contact & Support

For questions about this report or to request additional security services:

- 🌐 **Website:** [solarizer.io](https://solarizer.io)
- 📧 **Email:** hello@solarizer.io


---

<div align="center">

**Solarizer** | AI-Powered Smart Contract Security

*Report generated on ${generatedDate}*

© ${new Date().getFullYear()} Solarizer Security Intelligence

</div>
`;

  return markdown;
};

export const downloadMarkdown = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
