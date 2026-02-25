import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = { 'Content-Type': 'application/json' };

interface FailRequest {
  sessionId: string;
  error: string;
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

    let body: FailRequest;
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

    // Update orchestration row with zero-row detection
    const { data: updated, error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        status: 'failed',
        error: body.error || 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId)
      .in('status', ['queued', 'running'])
      .select('session_id');

    if (updateError) {
      console.error('cli-audit-fail: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to mark audit as failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // If zero rows matched, audit already in terminal state — skip credit release
    if (!updated || updated.length === 0) {
      console.log(`cli-audit-fail: Audit ${body.sessionId} already terminal, skipping credit release`);
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Read credits before atomic lock
    const { data: auditRow } = await supabase
      .from('audits')
      .select('user_id, credits_reserved')
      .eq('id', body.sessionId)
      .single();

    const creditsToRelease = auditRow?.credits_reserved ?? 0;
    const auditUserId = auditRow?.user_id;

    // Atomic lock — only one caller (fail, cancel, or complete) gets through
    const { data: locked } = await supabase
      .from('audits')
      .update({
        is_locked: true,
        status: 'failed',
        credits_reserved: 0,
        error_message: body.error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.sessionId)
      .eq('is_locked', false)
      .select('user_id');

    if (locked && locked.length > 0 && auditUserId && creditsToRelease > 0) {
      await supabase.rpc('cli_release_credits', {
        p_user_id: auditUserId,
        p_amount: creditsToRelease,
        p_audit_id: body.sessionId,
        p_description: `Release: Audit failed — ${body.error}`,
      });
    }

    console.log(`cli-audit-fail: Audit ${body.sessionId} marked as failed`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-fail: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
