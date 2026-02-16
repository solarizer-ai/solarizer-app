import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const keyId = body.keyId;
    if (!keyId) {
      return new Response(
        JSON.stringify({ error: 'keyId is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: keyData, error: fetchError } = await supabase
      .from('api_keys')
      .select('key_encrypted, user_id, revoked_at')
      .eq('id', keyId)
      .single();

    if (fetchError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'Key not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (keyData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (keyData.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'Key has been revoked' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!keyData.key_encrypted) {
      return new Response(
        JSON.stringify({ error: 'Key cannot be revealed (generated before encryption was enabled)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const encryptionKey = Deno.env.get('GITHUB_TOKEN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const plainKey = await decrypt(keyData.key_encrypted, encryptionKey);

    return new Response(
      JSON.stringify({ key: plainKey }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-reveal-api-key: Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
