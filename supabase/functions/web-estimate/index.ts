import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.slice(7);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error: authError } = await authClient.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { scopeFiles, contextFiles } = body as {
      scopeFiles?: Array<{ name: string; content: string }>;
      contextFiles?: Array<{ name: string; content: string }>;
    };

    if (!Array.isArray(scopeFiles) || scopeFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'scopeFiles must be a non-empty array' }), { status: 400, headers: corsHeaders });
    }

    const contextArr = Array.isArray(contextFiles) ? contextFiles : [];
    const totalFiles = scopeFiles.length + contextArr.length;

    if (totalFiles > 100) {
      return new Response(JSON.stringify({ error: 'Combined file count must not exceed 100' }), { status: 400, headers: corsHeaders });
    }

    for (const f of [...scopeFiles, ...contextArr]) {
      if (!f || typeof f.name !== 'string' || typeof f.content !== 'string') {
        return new Response(JSON.stringify({ error: 'Each file must have string fields: name, content' }), { status: 400, headers: corsHeaders });
      }
      if (f.content.length > 1_048_576) {
        return new Response(JSON.stringify({ error: `File "${f.name}" exceeds 1MB limit` }), { status: 400, headers: corsHeaders });
      }
    }

    const proxyUrl = Deno.env.get('CLOUD_RUN_PROXY_URL');
    const sessionSecret = Deno.env.get('SESSION_SECRET');

    if (!proxyUrl || !sessionSecret) {
      console.error('web-estimate: CLOUD_RUN_PROXY_URL or SESSION_SECRET not set');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), { status: 500, headers: corsHeaders });
    }

    const proxyPayload = {
      scopeFiles: scopeFiles.map(f => ({ path: f.name, content: f.content })),
      contextFiles: contextArr.map(f => ({ path: f.name, content: f.content })),
    };

    const proxyResponse = await fetch(`${proxyUrl}/estimate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-secret': sessionSecret,
      },
      body: JSON.stringify(proxyPayload),
    });

    const proxyData = await proxyResponse.json();

    if (!proxyResponse.ok) {
      console.error(`web-estimate: Proxy returned ${proxyResponse.status}:`, proxyData);
      return new Response(JSON.stringify({ error: 'Estimation failed. Please retry.' }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify(proxyData), { headers: corsHeaders });

  } catch (err) {
    console.error('web-estimate: Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
