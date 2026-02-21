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

    // RPC failed — return error so caller retries
    console.error('chat-token-update: increment_chat_tokens RPC failed:', rpcError.message);
    return new Response(
      JSON.stringify({ error: 'Failed to update tokens' }),
      { status: 500, headers: corsHeaders }
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
