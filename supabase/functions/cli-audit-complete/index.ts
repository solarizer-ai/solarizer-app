import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = { 'Content-Type': 'application/json' };

interface CoverageTestDetail {
  test_name: string;
  status: 'PASSED' | 'FAILED';
  proof: string | null;
  file: string;
  related_finding_title: string | null;
}

interface CoverageData {
  total_tests: number;
  passed: number;
  failed: number;
  details: CoverageTestDetail[];
}

interface CompleteRequest {
  sessionId: string;
  findings: unknown[];
  reportMarkdown: string;
  findingsCount: number;
  coverage_data?: CoverageData;
  system_hologram?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  try {
    if (!verifyServiceSecret(req)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    let body: CompleteRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createServiceClient();

    // 1. Guard: only update orchestration if still in non-terminal state
    const { data: orchUpdated, error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        status: 'completed',
        phase: 'completed',
        findings: body.findings || [],
        report_markdown: body.reportMarkdown || '',
        findings_count: body.findingsCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId)
      .in('status', ['queued', 'running'])
      .select('session_id');

    if (updateError) {
      console.error('cli-audit-complete: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete audit' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If zero rows matched, orchestration already in terminal state
    if (!orchUpdated || orchUpdated.length === 0) {
      console.log(`cli-audit-complete: Audit ${body.sessionId} already in terminal state`);
      return new Response(
        JSON.stringify({ success: true, already_completed: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    console.log(`cli-audit-complete: Audit ${body.sessionId} completed with ${body.findingsCount} findings`);

    // ── Atomic credit settlement ──────────────────────

    // 2. Atomic lock acquisition — prevents double settlement
    const { data: locked } = await supabase
      .from('audits')
      .update({ is_locked: true, updated_at: new Date().toISOString() })
      .eq('id', body.sessionId)
      .eq('is_locked', false)
      .select('user_id, credits_deducted, contracts_total');

    if (!locked || locked.length === 0) {
      // Already settled (duplicate call) — skip credit operations
      console.log(`cli-audit-complete: Audit ${body.sessionId} already settled`);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    const audit = locked[0];

    // 3. Calculate grade from findings
    const severities = ((body.findings || []) as Array<Record<string, unknown>>).map(
      (f) =>
        typeof f.severity === 'string' ? f.severity.toLowerCase() : ''
    );

    function calculateGrade(sevs: string[]): string {
      if (sevs.includes('critical')) return 'F';
      if (sevs.includes('high')) return 'D';
      if (sevs.includes('medium')) return 'C';
      if (sevs.includes('low')) return 'B';
      return 'A';
    }

    const grade = calculateGrade(severities);
    const finalStatus = severities.some(
      (s: string) => s === 'critical' || s === 'high' || s === 'medium'
    )
      ? 'issues'
      : 'secured';

    // 4. Finalize audit status — credits already deducted at start, no commit needed
    await supabase
      .from('audits')
      .update({
        status: finalStatus,
        grade,
        contracts_completed: audit.contracts_total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId);

    // 5. Merge coverage_data and system_hologram metadata
    const metadataUpdate: Record<string, unknown> = {};

    if (body.coverage_data) {
      const { data: existingAudit } = await supabase
        .from('audits')
        .select('coverage_data')
        .eq('id', body.sessionId)
        .single();

      if (existingAudit?.coverage_data &&
          typeof existingAudit.coverage_data === 'object' &&
          (existingAudit.coverage_data as CoverageData).details) {
        const existingData = existingAudit.coverage_data as CoverageData;
        const testMap = new Map<string, CoverageTestDetail>();
        (existingData.details || []).forEach(
          (t: CoverageTestDetail) => testMap.set(`${t.file}::${t.test_name}`, t)
        );
        (body.coverage_data.details || []).forEach(
          (t: CoverageTestDetail) => testMap.set(`${t.file}::${t.test_name}`, t)
        );
        const merged = Array.from(testMap.values());
        metadataUpdate.coverage_data = {
          total_tests: merged.length,
          passed: merged.filter((t) => t.status === 'PASSED').length,
          failed: merged.filter((t) => t.status === 'FAILED').length,
          details: merged,
        };
      } else {
        metadataUpdate.coverage_data = body.coverage_data;
      }
    }

    if (body.system_hologram) {
      const { data: hologramAudit } = await supabase
        .from('audits')
        .select('system_hologram')
        .eq('id', body.sessionId)
        .single();
      const existing =
        (hologramAudit?.system_hologram as Record<string, unknown>) || {};
      metadataUpdate.system_hologram = { ...existing, ...body.system_hologram };
    }

    if (Object.keys(metadataUpdate).length > 0) {
      await supabase
        .from('audits')
        .update(metadataUpdate)
        .eq('id', body.sessionId);
      console.log(`cli-audit-complete: Merged metadata keys: ${Object.keys(metadataUpdate).join(', ')}`);
    }

    console.log(
      `cli-audit-complete: Settled ${audit.credits_deducted} credits, ` +
      `grade=${grade}, status=${finalStatus}`
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-complete: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
