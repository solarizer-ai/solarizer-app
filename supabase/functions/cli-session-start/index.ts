import { validateApiKey, createServiceClient } from '../_shared/apiKeyAuth.ts';
import { encode as base64url } from 'https://deno.land/std@0.208.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Content-Type': 'application/json',
};

interface ScopeFile {
  path: string;
  nLOC: number;
  complexity: 'L1' | 'L2' | 'L3';
}

interface ContextFile {
  path: string;
  nLOC: number;
}

interface SessionStartRequest {
  project_name: string;
  feature: 'audit';
  scope_metadata: ScopeFile[];
  context_metadata: ContextFile[];
  estimated_cost: number;
}

async function signJWT(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigB64 = base64url(new Uint8Array(signature));

  return `${data}.${sigB64}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('cli-session-start: Request received');

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
    console.log(`cli-session-start: Authenticated user ${userId}`);

    const sessionSecret = Deno.env.get('SESSION_SECRET');
    const proxyUrl = Deno.env.get('CLOUD_RUN_PROXY_URL');
    if (!sessionSecret) {
      console.error('cli-session-start: SESSION_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }
    if (!proxyUrl) {
      console.error('cli-session-start: CLOUD_RUN_PROXY_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    let body: SessionStartRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { project_name, scope_metadata, context_metadata, estimated_cost, idempotency_key } = body;

    if (!project_name || typeof project_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'project_name is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(scope_metadata) || scope_metadata.length === 0) {
      return new Response(
        JSON.stringify({ error: 'scope_metadata must be a non-empty array' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof estimated_cost !== 'number' || estimated_cost <= 0) {
      return new Response(
        JSON.stringify({ error: 'estimated_cost must be a positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // B4: Idempotency check
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('audits')
        .select('id, status')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            session_id: existing.id,
            status: existing.status,
            duplicate: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      }
    }

    // Deduct credits upfront
    const { data: deductResult, error: deductError } = await supabase.rpc('cli_deduct_credits', {
      p_user_id: userId,
      p_amount: estimated_cost,
      p_audit_id: null,
      p_description: `CLI Audit: ${project_name} (${scope_metadata.length} contracts, ${estimated_cost} credits)`,
    });

    if (deductError) {
      console.error('cli-session-start: Credit deduction error:', deductError);
      return new Response(
        JSON.stringify({ error: 'Failed to process credits' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!deductResult?.success) {
      return new Response(
        JSON.stringify({
          error: deductResult?.error || 'Insufficient credits',
          credits_remaining: deductResult?.balance,
          credits_required: estimated_cost,
        }),
        { status: 402, headers: corsHeaders }
      );
    }

    // Create audit record
    const totalNloc = scope_metadata.reduce((sum: number, f: ScopeFile) => sum + f.nLOC, 0);

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        idempotency_key: idempotency_key || null,
        user_id: userId,
        project_name,
        status: 'analyzing',
        source: 'cli',
        nloc_count: totalNloc,
        credits_deducted: estimated_cost,
        scope_metadata,
        context_metadata: context_metadata || [],
        contracts_total: scope_metadata.length,
        contracts_completed: 0,
        is_locked: false,
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      console.error('cli-session-start: Failed to create audit:', auditError);
      const { error: refundError } = await supabase.rpc('cli_refund_credits', {
        p_user_id: userId,
        p_amount: estimated_cost,
        p_audit_id: null,
        p_description: `Refund: Audit creation failed for ${project_name}`,
      });
      if (refundError) {
        console.error(
          `cli-session-start: CRITICAL — refund of ${estimated_cost} credits failed for user ${userId}:`,
          refundError
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to create audit session' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const auditId = audit.id;

    // Link credit_txns to audit (best effort)
    await supabase
      .from('credit_txns')
      .update({ audit_id: auditId })
      .eq('user_id', userId)
      .eq('type', 'deduction')
      .is('audit_id', null)
      .order('created_at', { ascending: false })
      .limit(1);

    // Generate session JWT
    const now = Math.floor(Date.now() / 1000);
    const sessionToken = await signJWT({
      sessionId: auditId,
      userId,
      allowedModels: ['gemini-3-flash', 'gemini-3-pro', 'claude-opus-4-20250514'],
      maxCalls: 50,
      iat: now,
      exp: now + (2 * 60 * 60),
    }, sessionSecret);

    // WEB-8: Store SHA-256 hash of session token instead of plaintext
    const tokenBytes = new TextEncoder().encode(sessionToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', tokenBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sessionTokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // WEB-3: Generate per-audit callback token using HMAC
    const callbackSecret = Deno.env.get('CALLBACK_SECRET');
    let callbackToken: string | null = null;
    if (callbackSecret) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(callbackSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(auditId));
      callbackToken = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    await supabase
      .from('audits')
      .update({
        session_token_hash: sessionTokenHash,
        session_token: null, // Stop storing plaintext
        callback_token: callbackToken,
      })
      .eq('id', auditId);

    console.log(`cli-session-start: Session created for audit ${auditId}`);

    return new Response(
      JSON.stringify({
        session_id: auditId,
        session_token: sessionToken,
        callback_token: callbackToken,
        proxy_url: proxyUrl,
        remaining_credits: deductResult.balance,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-session-start: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
