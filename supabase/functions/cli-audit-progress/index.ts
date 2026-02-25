import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = { 'Content-Type': 'application/json' };

interface ProgressRequest {
  sessionId: string;
  phase: string;
  progress: Record<string, unknown>;
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

    let body: ProgressRequest;
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

    // Status-guarded update: only update if still queued/running
    const { data: updated, error: updateError } = await supabase
      .from('audit_orchestration')
      .update({
        status: 'running',
        phase: body.phase || 'running',
        progress: body.progress || {},
        findings_count: body.findingsCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', body.sessionId)
      .in('status', ['queued', 'running'])
      .select('aborted');

    if (updateError) {
      // Genuine DB error — report it
      console.error('cli-audit-progress: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update progress' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!updated || updated.length === 0) {
      // Zero rows matched — audit already in terminal state
      // Read current aborted flag so proxy knows to stop
      const { data: current } = await supabase
        .from('audit_orchestration')
        .select('aborted')
        .eq('session_id', body.sessionId)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          aborted: current?.aborted ?? true,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        aborted: updated[0]?.aborted ?? false,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-progress: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
