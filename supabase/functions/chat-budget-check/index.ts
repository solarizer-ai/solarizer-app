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

    const { chat_session_id } = await req.json();

    if (!chat_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing chat_session_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .select('id, user_id, tokens_used, token_budget, expires_at')
      .eq('id', chat_session_id)
      .single();

    if (error || !session) {
      console.error('chat-budget-check: Session not found:', chat_session_id);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session expired', tokens_used: session.tokens_used, token_budget: session.token_budget }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Check budget
    const tokensRemaining = Math.max(0, session.token_budget - session.tokens_used);

    if (tokensRemaining <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Token budget exhausted',
          tokens_used: session.tokens_used,
          token_budget: session.token_budget,
          tokens_remaining: 0,
        }),
        { status: 429, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        chat_session_id: session.id,
        user_id: session.user_id,
        tokens_used: session.tokens_used,
        token_budget: session.token_budget,
        tokens_remaining: tokensRemaining,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('chat-budget-check: Error:', msg);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
