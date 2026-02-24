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
