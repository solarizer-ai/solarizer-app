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

  console.log('cli-check-credits: Request received');

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

    const userId = authResult.userId;

    const { data: credits } = await supabase
      .from('nloc_credits')
      .select('credits_remaining, scans_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const tier = subscription?.plan || 'free';
    let tierDiscount = 0.00;
    if (tier === 'pro' || tier === 'business') {
      tierDiscount = 0.07;
    }

    const { data: activeAudits } = await supabase
      .from('audits')
      .select('id, status, contracts_completed, contracts_total, project_name')
      .eq('user_id', userId)
      .eq('is_locked', false)
      .in('status', ['analyzing'])
      .order('created_at', { ascending: false });

    const activeSessions = (activeAudits || []).map(a => ({
      audit_id: a.id,
      status: a.status,
      contracts_completed: a.contracts_completed || 0,
      contracts_total: a.contracts_total || 0,
      project_name: a.project_name,
    }));

    return new Response(
      JSON.stringify({
        credits_remaining: credits?.credits_remaining || 0,
        scans_remaining: credits?.scans_remaining || 0,
        tier,
        tier_discount: tierDiscount,
        active_sessions: activeSessions,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-check-credits: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
