import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!verifyServiceSecret(req)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { sessionId, action } = await req.json();

    if (!sessionId || !action) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();

    if (action === 'verify') {
      const { data, error } = await supabase
        .from('audit_orchestration')
        .select('status, request_payload')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        if (error?.code === 'PGRST116') {
          return new Response(JSON.stringify({ error: 'Audit session not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        console.error('verify query error:', error);
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tier = (data.request_payload as Record<string, unknown>)?.tier ?? null;

      return new Response(JSON.stringify({ status: data.status, tier }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'claim') {
      const { data, error } = await supabase
        .from('audit_orchestration')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('status', 'queued')
        .select('status');

      if (error) {
        console.error('claim update error:', error);
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (data && data.length > 0) {
        return new Response(JSON.stringify({ claimed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Already claimed or not queued — fetch current status
      const { data: current } = await supabase
        .from('audit_orchestration')
        .select('status')
        .eq('session_id', sessionId)
        .single();

      return new Response(
        JSON.stringify({ claimed: false, currentStatus: current?.status ?? 'unknown' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('audit-session-ops error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
