import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-service-secret, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate service secret
    const serviceSecret = req.headers.get('x-service-secret');
    const expectedSecret = Deno.env.get('SESSION_SECRET');

    if (!expectedSecret || serviceSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { chat_session_id, tokens_used } = await req.json();

    if (!chat_session_id || typeof tokens_used !== 'number' || tokens_used < 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid chat_session_id / tokens_used' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try RPC first (atomic increment)
    const { data: newTokensUsed, error: rpcError } = await supabase.rpc(
      'increment_chat_tokens',
      { p_session_id: chat_session_id, p_tokens: tokens_used }
    );

    if (!rpcError) {
      console.log(`chat-token-update: Session ${chat_session_id} += ${tokens_used}, total: ${newTokensUsed}`);
      return new Response(
        JSON.stringify({ tokens_used: newTokensUsed }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fallback: direct UPDATE
    console.warn('chat-token-update: RPC failed, falling back to direct UPDATE:', rpcError.message);

    const { data: updated, error: updateError } = await supabase
      .from('chat_sessions')
      .update({ tokens_used: supabase.rpc ? undefined : undefined }) // placeholder
      .eq('id', chat_session_id)
      .select('tokens_used')
      .single();

    // Direct SQL-style fallback using raw update
    const { error: fallbackError } = await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_session_id);

    // Since we can't do atomic increment via .update(), use a second RPC attempt or raw SQL
    // Best effort: read current, compute, write
    const { data: current } = await supabase
      .from('chat_sessions')
      .select('tokens_used')
      .eq('id', chat_session_id)
      .single();

    if (current) {
      const newTotal = current.tokens_used + tokens_used;
      const { error: setError } = await supabase
        .from('chat_sessions')
        .update({ tokens_used: newTotal, updated_at: new Date().toISOString() })
        .eq('id', chat_session_id);

      if (setError) {
        console.error('chat-token-update: Fallback update failed:', setError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to update tokens' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`chat-token-update: Fallback success. Session ${chat_session_id} total: ${newTotal}`);
      return new Response(
        JSON.stringify({ tokens_used: newTotal }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers: corsHeaders }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('chat-token-update: Error:', msg);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
