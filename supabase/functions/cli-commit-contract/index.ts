import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode as base64urlDecode } from 'https://deno.land/std@0.208.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

interface CommitContractRequest {
  session_id: string;
  contract_path: string;
  credit_amount: number;
}

async function verifySessionJWT(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64urlDecode(signatureB64);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `Token verification failed: ${err}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('cli-commit-contract: Request received');

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing session token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const sessionSecret = Deno.env.get('SESSION_SECRET');
    if (!sessionSecret) {
      console.error('cli-commit-contract: SESSION_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtResult = await verifySessionJWT(token, sessionSecret);

    if (!jwtResult.valid || !jwtResult.payload) {
      return new Response(
        JSON.stringify({ error: jwtResult.error || 'Invalid session token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const sessionId = jwtResult.payload.sessionId as string;
    const userId = jwtResult.payload.userId as string;

    let body: CommitContractRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.session_id !== sessionId) {
      return new Response(
        JSON.stringify({ error: 'session_id does not match token' }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (!body.contract_path || typeof body.contract_path !== 'string') {
      return new Response(
        JSON.stringify({ error: 'contract_path is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof body.credit_amount !== 'number' || body.credit_amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'credit_amount must be a positive number' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch audit record
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, user_id, is_locked, credits_reserved')
      .eq('id', sessionId)
      .single();

    if (auditError || !audit) {
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (audit.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (audit.is_locked) {
      return new Response(
        JSON.stringify({ error: 'Audit is locked' }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Clamp credit_amount to credits_reserved
    const creditsReserved = Number(audit.credits_reserved) || 0;
    const clampedAmount = Math.min(body.credit_amount, creditsReserved);

    if (clampedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: 'No reserved credits to commit' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Commit credits via RPC
    const { data: commitResult, error: commitError } = await supabase.rpc('cli_commit_credits', {
      p_user_id: userId,
      p_amount: clampedAmount,
      p_audit_id: sessionId,
      p_description: `Contract: ${body.contract_path}`,
    });

    if (commitError) {
      console.error('cli-commit-contract: Commit RPC failed:', commitError);
      return new Response(
        JSON.stringify({ error: 'Failed to commit credits' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const rpcResult = commitResult as Record<string, unknown>;
    if (rpcResult?.success === false) {
      return new Response(
        JSON.stringify({ error: rpcResult.error || 'Credit commit failed' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update audit record
    const newReserved = creditsReserved - clampedAmount;
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        credits_reserved: newReserved,
        contracts_completed: (await supabase.from('audits').select('contracts_completed').eq('id', sessionId).single()).data?.contracts_completed + 1 || 1,
        current_contract: body.contract_path,
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('cli-commit-contract: Failed to update audit:', updateError);
    }

    console.log(`cli-commit-contract: Committed ${clampedAmount} credits for contract ${body.contract_path}, remaining reserved: ${newReserved}`);

    return new Response(
      JSON.stringify({
        success: true,
        committed: clampedAmount,
        remaining_reserved: newReserved,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-commit-contract: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
