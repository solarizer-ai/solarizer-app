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

  console.log('cli-auth: Request received');

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
      console.error('cli-auth: API key validation failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error || 'Invalid API key' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = authResult.userId;
    console.log(`cli-auth: Authenticated user ${userId}`);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('cli-auth: Failed to fetch profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // Fetch credits
    const { data: credits } = await supabase
      .from('nloc_credits')
      .select('credits_remaining, scans_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    // Check for active audit
    const { data: activeAudits } = await supabase
      .from('audits')
      .select('id, status, contracts_completed, contracts_total, project_name')
      .eq('user_id', userId)
      .eq('is_locked', false)
      .in('status', ['analyzing'])
      .order('created_at', { ascending: false })
      .limit(1);

    const activeAudit = activeAudits && activeAudits.length > 0
      ? {
          audit_id: activeAudits[0].id,
          status: activeAudits[0].status,
          contracts_completed: activeAudits[0].contracts_completed || 0,
          contracts_total: activeAudits[0].contracts_total || 0,
          project_name: activeAudits[0].project_name,
        }
      : null;

    const tier = subscription?.plan || 'free';

    console.log(`cli-auth: User ${userId} - tier: ${tier}, credits: ${credits?.credits_remaining || 0}`);

    return new Response(
      JSON.stringify({
        user_id: userId,
        email: profile.email,
        display_name: profile.display_name,
        tier,
        credits_remaining: credits?.credits_remaining || 0,
        scans_remaining: credits?.scans_remaining || 0,
        active_audit: activeAudit,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-auth: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
