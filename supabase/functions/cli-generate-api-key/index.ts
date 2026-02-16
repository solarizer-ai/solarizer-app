import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const MAX_KEYS_PER_USER = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('cli-generate-api-key: Request received');

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error('cli-generate-api-key: Auth failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    console.log(`cli-generate-api-key: Authenticated user ${userId}`);

    let body: { name?: string };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const keyName = body.name || 'Default';

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check key count limit
    const { count, error: countError } = await supabase
      .from('api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('revoked_at', null);

    if (countError) {
      console.error('cli-generate-api-key: Failed to count keys:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing keys' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if ((count || 0) >= MAX_KEYS_PER_USER) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_KEYS_PER_USER} active API keys allowed. Revoke an existing key first.` }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate key: sol_live_ + 32 random hex chars
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const fullKey = `sol_live_${randomHex}`;
    const keyPrefix = 'sol_live';

    const keyHash = await bcrypt.hash(fullKey, 10);

    const { error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: keyName,
      });

    if (insertError) {
      console.error('cli-generate-api-key: Failed to insert key:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create API key' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`cli-generate-api-key: Created key "${keyName}" for user ${userId}`);

    return new Response(
      JSON.stringify({
        key: fullKey,
        prefix: keyPrefix,
        name: keyName,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-generate-api-key: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
