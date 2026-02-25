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

    const { data: updated, error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        aborted: true,
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId)
      .eq('user_id', authResult.userId)
      .in('status', ['queued', 'running'])
      .select('session_id');

    if (updateError) {
      console.error('cli-audit-cancel: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to cancel audit' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!updated || updated.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Audit already completed or cancelled' }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Read credits_deducted BEFORE the atomic update
    const { data: auditRow } = await supabase
      .from('audits')
      .select('credits_deducted')
      .eq('id', body.sessionId)
      .eq('user_id', authResult.userId)
      .single();

    const creditsToRefund = auditRow?.credits_deducted ?? 0;

    // Atomic lock — only succeeds if is_locked is still false
    const { data: locked } = await supabase
      .from('audits')
      .update({
        is_locked: true,
        status: 'cancelled',
        credits_deducted: 0,
        error_message: 'Cancelled by user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId)
      .eq('user_id', authResult.userId)
      .eq('is_locked', false)
      .select('user_id');

    if (locked && locked.length > 0 && creditsToRefund > 0) {
      await supabase.rpc('cli_refund_credits', {
        p_user_id: authResult.userId,
        p_amount: creditsToRefund,
        p_audit_id: body.sessionId,
        p_description: 'Refund: Audit cancelled by user',
      });
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
