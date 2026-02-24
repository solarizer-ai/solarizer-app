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

    const { error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        aborted: true,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId)
      .eq('user_id', authResult.userId)
      .in('status', ['queued', 'running']);

    if (updateError) {
      console.error('cli-audit-cancel: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to cancel audit' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Also release credits for the audit
    const { data: audit } = await supabase
      .from('audits')
      .select('credits_reserved, is_locked')
      .eq('id', body.sessionId)
      .single();

    if (audit && !audit.is_locked && audit.credits_reserved > 0) {
      await supabase.rpc('cli_release_credits', {
        p_user_id: authResult.userId,
        p_amount: audit.credits_reserved,
        p_audit_id: body.sessionId,
        p_description: 'Release: Audit cancelled by user',
      });

      await supabase
        .from('audits')
        .update({
          status: 'failed',
          is_locked: true,
          credits_reserved: 0,
          error_message: 'Cancelled by user',
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.sessionId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-cancel: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
