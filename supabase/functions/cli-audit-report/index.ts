import { validateApiKey, createServiceClient } from '../_shared/apiKeyAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing x-api-key header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const authResult = await validateApiKey(apiKey, supabase);
    if (!authResult.valid || !authResult.userId) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Invalid API key' }),
        { status: 401, headers: corsHeaders }
      );
    }

    let body: { sessionId: string };
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

    const { data: orch, error: fetchError } = await supabase
      .from('audit_orchestration')
      .select('status, findings, report_markdown, findings_count')
      .eq('session_id', body.sessionId)
      .eq('user_id', authResult.userId)
      .single();

    if (fetchError || !orch) {
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (orch.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Audit not yet completed', status: orch.status }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        findings: orch.findings || [],
        report_markdown: orch.report_markdown || '',
        findings_count: orch.findings_count || 0,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-report: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
