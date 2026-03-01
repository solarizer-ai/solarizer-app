import type { Audit, Finding } from "@/hooks/useAudits";

export interface VulnerabilityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  gas: number;
}

interface ExportOptions {
  audit: Audit;
  findings: Finding[];
  vulnerabilityCounts: VulnerabilityCounts;
}

function generateReportId(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `SOL-${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} at ${hours}:${minutes} UTC`;
}

function computeOverallRisk(counts: VulnerabilityCounts): string {
  if (counts.critical > 0 || counts.high > 0) {
    return '**Overall Risk: HIGH** — Critical issues require immediate attention before deployment.';
  }
  if (counts.medium > 0) {
    return '**Overall Risk: MODERATE** — Issues identified that should be addressed before production use.';
  }
  if (counts.low + counts.info + counts.gas > 0) {
    return '**Overall Risk: LOW** — No critical issues found. Consider addressing low-severity items for hardening.';
  }
  return '**Overall Risk: MINIMAL** — No issues identified within the scope of this analysis.';
}

const SEVERITY_CONFIG: Array<{
  key: keyof VulnerabilityCounts;
  emoji: string;
  label: string;
  heading: string;
  prefix: string;
}> = [
  { key: 'critical', emoji: '🔴', label: 'Critical', heading: '🔴 Critical Findings', prefix: 'CRIT' },
  { key: 'high', emoji: '🟠', label: 'High', heading: '🟠 High Severity Findings', prefix: 'HIGH' },
  { key: 'medium', emoji: '🟡', label: 'Medium', heading: '🟡 Medium Severity Findings', prefix: 'MED' },
  { key: 'low', emoji: '🔵', label: 'Low', heading: '🔵 Low Severity Findings', prefix: 'LOW' },
  { key: 'info', emoji: 'ℹ️', label: 'Informational', heading: 'ℹ️ Informational Findings', prefix: 'INFO' },
  { key: 'gas', emoji: '⛽', label: 'Gas Optimization', heading: '⛽ Gas Optimization Findings', prefix: 'GAS' },
];

export const generateMarkdownReport = (options: ExportOptions): string => {
  const { audit, findings, vulnerabilityCounts } = options;
  const counts = { ...vulnerabilityCounts, gas: vulnerabilityCounts.gas ?? findings.filter(f => f.severity === 'gas').length };
  const totalFindings = Object.values(counts).reduce((a, b) => a + b, 0);
  const overallRisk = computeOverallRisk(counts);
  const passRate = audit.coverage_data?.total_tests
    ? ((audit.coverage_data.passed / audit.coverage_data.total_tests) * 100).toFixed(1)
    : null;

  let md = '';

  // 1. Title + metadata
  md += `# Solarizer Security Audit Report\n\n`;
  md += `**Project:** ${audit.project_name}\n`;
  md += `**Report ID:** ${generateReportId(audit.created_at)}\n`;
  md += `**Generated:** ${formatDate(audit.created_at)}\n`;
  md += `**Lines Analyzed:** ${audit.nloc_count?.toLocaleString() ?? 'N/A'} nLOC\n`;
  md += `**Engine Version:** 1.0\n\n`;

  // 2. Table of Contents
  let tocNum = 0;
  md += `## Table of Contents\n\n`;
  md += `${++tocNum}. [Executive Summary](#executive-summary)\n`;
  md += `${++tocNum}. [Audit Scope](#audit-scope)\n`;
  md += `${++tocNum}. [Methodology](#methodology)\n`;
  md += `${++tocNum}. [Risk Summary](#risk-summary)\n`;
  for (const s of SEVERITY_CONFIG) {
    if (counts[s.key] > 0) {
      const anchor = s.heading.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      md += `${++tocNum}. [${s.heading}](#${anchor})\n`;
    }
  }
  if (audit.coverage_data && audit.coverage_data.total_tests > 0) {
    md += `${++tocNum}. [Verification Coverage](#verification-coverage)\n`;
  }
  md += `${++tocNum}. [Disclaimer](#disclaimer)\n`;
  md += `\n`;

  // 3. Executive Summary
  md += `## Executive Summary\n\n`;
  md += `| Severity | Count |\n`;
  md += `|----------|-------|\n`;
  for (const s of SEVERITY_CONFIG) {
    md += `| ${s.emoji} ${s.label} | ${counts[s.key]} |\n`;
  }
  md += `| **Total** | **${totalFindings}** |\n`;
  if (audit.grade) md += `| Security Grade | ${audit.grade} |\n`;
  if (audit.security_score != null) md += `| Security Score | ${audit.security_score}% |\n`;
  md += `\n${overallRisk}\n\n`;

  // 4. Audit Scope
  md += `## Audit Scope\n\n`;
  md += `**Contracts in scope:** ${audit.contract_count}\n\n`;
  const scopeMeta = audit.scope_metadata as Array<{ path: string; nLOC: number; complexity?: string | number }> | null;
  if (scopeMeta && scopeMeta.length > 0) {
    for (const file of scopeMeta) {
      md += `- ${file.path} (${file.nLOC} nLOC)\n`;
    }
    md += `\n`;
  }

  // 5. Methodology + Severity Classification
  md += `## Methodology\n\n`;
  md += `This report was generated by the Solarizer Security Engine, an AI-powered multi-phase analysis pipeline. The audit process includes:\n\n`;
  md += `1. **Static Analysis** — Pattern-based detection of known vulnerability classes\n`;
  md += `2. **Semantic Analysis** — Deep understanding of contract logic, state transitions, and access control patterns\n`;
  md += `3. **Cross-Contract Analysis** — Interaction analysis across contract boundaries and external dependencies\n`;
  md += `4. **Validation** — Independent re-analysis of all findings to filter false positives and confirm exploitability\n\n`;

  md += `### Severity Classification\n\n`;
  md += `| Level | Description |\n`;
  md += `|-------|-------------|\n`;
  md += `| 🔴 **Critical** | Directly exploitable vulnerabilities that can lead to loss of funds, unauthorized access, or protocol manipulation. Immediate remediation required. |\n`;
  md += `| 🟠 **High** | Significant vulnerabilities that pose substantial risk under specific conditions. Should be fixed before deployment. |\n`;
  md += `| 🟡 **Medium** | Issues that could lead to unexpected behavior or become exploitable in combination with other factors. Recommended to fix. |\n`;
  md += `| 🔵 **Low** | Minor issues with limited direct impact. Best practice violations or edge cases. Consider fixing. |\n`;
  md += `| ℹ️ **Informational** | Code quality observations, style suggestions, and best practice recommendations. No direct security impact. |\n`;
  md += `| ⛽ **Gas** | Opportunities to reduce gas consumption without affecting functionality. |\n\n`;

  // 6. Risk Summary
  md += `## Risk Summary\n\n`;
  md += `${overallRisk}\n\n`;
  const fPlural = totalFindings === 1 ? 'finding' : 'findings';
  const cPlural = audit.contract_count === 1 ? 'contract' : 'contracts';
  md += `The analysis identified **${totalFindings}** ${fPlural} across **${audit.contract_count}** ${cPlural}.\n\n`;

  // 7. Findings by severity
  if (totalFindings === 0) {
    md += `No issues were identified within the scope of this analysis.\n\n`;
  } else {
    for (const s of SEVERITY_CONFIG) {
      const sevFindings = findings.filter(f => f.severity === s.key);
      if (sevFindings.length === 0) continue;

      md += `## ${s.heading}\n\n`;

      sevFindings.forEach((finding, idx) => {
        md += `### ${s.prefix}-${idx + 1}: ${finding.title}\n\n`;

        if (finding.location) {
          md += `**Contract:** \`${finding.location}\`\n\n`;
        }

        md += `**Description**\n\n${finding.description}\n\n`;

        if (finding.code_snippet) {
          md += `**Code Snippet**\n\n\`\`\`solidity\n`;
          const lines = finding.code_snippet.split('\n');
          const startLine = finding.line_start || 1;
          lines.forEach((line, i) => {
            md += `${startLine + i} | ${line}\n`;
          });
          md += `\`\`\`\n\n`;
        }

        if (finding.remediation) {
          md += `**Remediation**\n\n${finding.remediation}\n\n`;
        }

        md += `---\n\n`;
      });
    }
  }

  // 8. Verification Coverage
  if (audit.coverage_data && audit.coverage_data.total_tests > 0) {
    md += `## Verification Coverage\n\n`;
    md += `The assessment included **${audit.coverage_data.total_tests}** automated security verification tests:\n\n`;
    md += `| Status | Count | Percentage |\n`;
    md += `|--------|-------|------------|\n`;
    md += `| ✅ Passed | ${audit.coverage_data.passed} | ${passRate}% |\n`;
    md += `| ❌ Failed | ${audit.coverage_data.failed} | ${((audit.coverage_data.failed / audit.coverage_data.total_tests) * 100).toFixed(1)}% |\n\n`;

    if (audit.coverage_data.details && audit.coverage_data.details.length > 0) {
      const fileGroups: { [key: string]: any[] } = {};
      audit.coverage_data.details.forEach((detail: any) => {
        if (!fileGroups[detail.file]) fileGroups[detail.file] = [];
        fileGroups[detail.file].push(detail);
      });

      if (Object.keys(fileGroups).length > 0) {
        md += `### Per-Contract Results\n\n`;
        Object.keys(fileGroups).forEach((fileName) => {
          const tests = fileGroups[fileName];
          const passed = tests.filter((t: any) => t.status === 'PASSED').length;
          const total = tests.length;
          md += `- **${fileName}**: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(0)}%)\n`;
        });
        md += `\n`;
      }
    }
  }

  // 9. Disclaimer
  md += `## Disclaimer\n\n`;
  md += `This report is provided by Solarizer for informational purposes only. The analysis was performed using automated AI-powered tools and does not constitute a formal security audit, legal advice, or a guarantee of security.\n\n`;
  md += `**Important limitations:**\n\n`;
  md += `- **No automated analysis can guarantee 100% security.** This report identifies potential vulnerabilities within the scope of the contracts analyzed but may not detect all possible issues, including novel attack vectors, economic exploits, or vulnerabilities arising from deployment configuration or off-chain components.\n`;
  md += `- **This report is not a substitute for a comprehensive manual security audit** by qualified security professionals. Critical protocols should undergo independent manual review in addition to automated analysis.\n`;
  md += `- **Solarizer does not guarantee that audited contracts are free from exploits.** The absence of findings does not imply the absence of vulnerabilities.\n`;
  md += `- **Findings reflect the state of the code at the time of analysis.** Any subsequent modifications to the contracts may introduce new vulnerabilities not covered by this report.\n`;
  md += `- **Deployment decisions remain the sole responsibility of the contract developers and deployers.** Solarizer expressly disclaims liability for any losses, damages, or exploits arising from the use or deployment of analyzed contracts.\n\n`;
  md += `For the full terms governing the use of this report, see our [Terms of Service](https://solarizer.io/terms).\n\n`;

  // 10. Footer
  md += `---\n\n`;
  md += `*Report generated by Solarizer Security Engine — solarizer.io*\n`;

  return md;
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
