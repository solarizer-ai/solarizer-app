import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#2563eb';
    case 'info': return '#6b7280';
    default: return '#6b7280';
  }
};

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A':
    case 'B': return '#22c55e';
    case 'C': return '#eab308';
    case 'D':
    case 'F': return '#ef4444';
    default: return '#6b7280';
  }
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const generateHtmlReport = (audit: AuditReport): string => {
  const gradeColor = getGradeColor(audit.grade);
  const date = new Date(audit.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const findingsHtml = audit.findings.map((finding, index) => `
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="background-color: ${getSeverityColor(finding.severity)}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          ${escapeHtml(finding.severity)}
        </span>
        <span style="font-weight: 600; font-size: 16px; color: #111827;">${escapeHtml(finding.title)}</span>
      </div>
      ${finding.location ? `<p style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">📍 ${escapeHtml(finding.location)}</p>` : ''}
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">${escapeHtml(finding.description)}</p>
      ${finding.remediation ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px;">
          <p style="font-weight: 600; color: #166534; font-size: 12px; margin-bottom: 4px;">💡 Remediation</p>
          <p style="color: #166534; font-size: 13px; line-height: 1.5;">${escapeHtml(finding.remediation)}</p>
        </div>
      ` : ''}
    </div>
  `).join('');

  const severityCounts = {
    critical: audit.findings.filter(f => f.severity === 'critical').length,
    high: audit.findings.filter(f => f.severity === 'high').length,
    medium: audit.findings.filter(f => f.severity === 'medium').length,
    low: audit.findings.filter(f => f.severity === 'low').length,
    info: audit.findings.filter(f => f.severity === 'info').length,
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Security Report - ${escapeHtml(audit.project_name)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; line-height: 1.5; padding: 40px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
        <div>
          <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px;">🛡️ ENX Pro Security Report</h1>
          <p style="color: #6b7280; font-size: 14px;">Smart Contract Security Audit</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 14px; color: #6b7280;">${date}</p>
        </div>
      </div>

      <!-- Project Overview -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px;">${escapeHtml(audit.project_name)}</h2>
            <p style="color: #6b7280; font-size: 14px;">Security Assessment Summary</p>
          </div>
          <div style="text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: ${gradeColor}20; border: 4px solid ${gradeColor}; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 36px; font-weight: 700; color: ${gradeColor};">${audit.grade}</span>
            </div>
            <p style="margin-top: 8px; font-size: 14px; color: #6b7280;">Score: ${audit.security_score}%</p>
          </div>
        </div>
      </div>

      <!-- Vulnerability Summary -->
      <div style="margin-bottom: 32px;">
        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">Vulnerability Summary</h3>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 100px; padding: 16px; background-color: #fef2f2; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #dc2626;">${severityCounts.critical}</p>
            <p style="font-size: 12px; color: #991b1b;">Critical</p>
          </div>
          <div style="flex: 1; min-width: 100px; padding: 16px; background-color: #fff7ed; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #ea580c;">${severityCounts.high}</p>
            <p style="font-size: 12px; color: #9a3412;">High</p>
          </div>
          <div style="flex: 1; min-width: 100px; padding: 16px; background-color: #fffbeb; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #d97706;">${severityCounts.medium}</p>
            <p style="font-size: 12px; color: #92400e;">Medium</p>
          </div>
          <div style="flex: 1; min-width: 100px; padding: 16px; background-color: #eff6ff; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #2563eb;">${severityCounts.low}</p>
            <p style="font-size: 12px; color: #1e40af;">Low</p>
          </div>
          <div style="flex: 1; min-width: 100px; padding: 16px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #6b7280;">${severityCounts.info}</p>
            <p style="font-size: 12px; color: #4b5563;">Info</p>
          </div>
        </div>
      </div>

      <!-- Detailed Findings -->
      <div>
        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">Detailed Findings</h3>
        ${audit.findings.length > 0 ? findingsHtml : '<p style="color: #6b7280; text-align: center; padding: 40px;">No vulnerabilities found. Great job! 🎉</p>'}
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px;">Generated by ENX Pro Smart Contract Security Platform</p>
        <p style="color: #9ca3af; font-size: 12px;">Report generated on ${date}</p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch audit data
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

    // Fetch findings
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

    const html = generateHtmlReport(reportData);

    console.log("Generated PDF report for audit:", auditId);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
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
