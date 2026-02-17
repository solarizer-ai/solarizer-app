import { validateApiKey, createServiceClient } from '../_shared/apiKeyAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Content-Type': 'application/json',
};

/** Map subscription tier to 24-hour token budget */
function getTokenBudget(tier: string): number {
  switch (tier) {
    case 'starter':
      return 900_000;
    case 'pro':
    case 'business':
      return 2_160_000;
    default:
      // free tier
      return 50_000;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('chat-session-init: Request received');

  try {
    const supabase = createServiceClient();

    // Authenticate via API key
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

    const userId = authResult.userId;
    console.log(`chat-session-init: Authenticated user ${userId}`);

    // Determine user's tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const tier = subscription?.plan || 'free';
    const tokenBudget = getTokenBudget(tier);

    // Check for active (non-expired) chat session
    const now = new Date().toISOString();
    const { data: activeSessions } = await supabase
      .from('chat_sessions')
      .select('id, tokens_used, token_budget, started_at, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('expires_at', { ascending: false })
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      const session = activeSessions[0];
      const tokensRemaining = Math.max(0, session.token_budget - session.tokens_used);

      console.log(`chat-session-init: Resuming session ${session.id} (${tokensRemaining} tokens remaining)`);

      return new Response(
        JSON.stringify({
          chat_session_id: session.id,
          tokens_used: session.tokens_used,
          token_budget: session.token_budget,
          tokens_remaining: tokensRemaining,
          expires_at: session.expires_at,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // No active session — create a new 24-hour session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: newSession, error: insertError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        tokens_used: 0,
        token_budget: tokenBudget,
        expires_at: expiresAt,
      })
      .select('id, tokens_used, token_budget, started_at, expires_at')
      .single();

    if (insertError || !newSession) {
      console.error('chat-session-init: Failed to create session:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create chat session' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`chat-session-init: Created new session ${newSession.id} (budget: ${tokenBudget}, tier: ${tier})`);

    return new Response(
      JSON.stringify({
        chat_session_id: newSession.id,
        tokens_used: 0,
        token_budget: tokenBudget,
        tokens_remaining: tokenBudget,
        expires_at: newSession.expires_at,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('chat-session-init: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
