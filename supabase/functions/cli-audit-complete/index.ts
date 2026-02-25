import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = { 'Content-Type': 'application/json' };

interface CompleteRequest {
  sessionId: string;
  findings: unknown[];
  reportMarkdown: string;
  findingsCount: number;
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

    // Update orchestration row with results
    const { error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        status: 'completed',
        phase: 'completed',
        findings: body.findings || [],
        report_markdown: body.reportMarkdown || '',
        findings_count: body.findingsCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId);

    if (updateError) {
      console.error('cli-audit-complete: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete audit' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`cli-audit-complete: Audit ${body.sessionId} completed with ${body.findingsCount} findings`);

    // ── Credit settlement & audit finalization ──────────────────────

    const { data: audit } = await supabase
      .from('audits')
      .select('user_id, credits_reserved, is_locked, contracts_total')
      .eq('id', body.sessionId)
      .single();

    if (audit && !audit.is_locked) {
      const severities = (body.findings || []).map(
        (f: Record<string, unknown>) =>
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

      if (audit.credits_reserved > 0) {
        await supabase.rpc('cli_commit_credits', {
          p_user_id: audit.user_id,
          p_amount: audit.credits_reserved,
          p_audit_id: body.sessionId,
          p_description: `Audit completed: ${body.findingsCount} findings`,
        });
      }

      await supabase.from('audits').update({
        status: finalStatus,
        grade,
        is_locked: true,
        credits_deducted: audit.credits_reserved,
        credits_reserved: 0,
        contracts_completed: audit.contracts_total,
        updated_at: new Date().toISOString(),
      }).eq('id', body.sessionId);

      console.log(
        `cli-audit-complete: Settled ${audit.credits_reserved} credits, ` +
        `grade=${grade}, status=${finalStatus}`
      );
    }

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
