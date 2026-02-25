import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { decode as base64urlDecode } from 'https://deno.land/std@0.208.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

interface HeartbeatRequest {
  session_id: string;
  contracts_completed?: number;
  contracts_total?: number;
  findings_count?: number;
  current_phase?: string;
  query?: boolean;
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

  try {
    const supabase = createServiceClient();

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing session token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const sessionSecret = Deno.env.get('SESSION_SECRET');
    if (!sessionSecret) {
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

    // Extract audit ID from sessionId (cli-session-start signs with { sessionId: auditId })
    const auditId = jwtResult.payload.sessionId as string;
    const userId = jwtResult.payload.userId as string;

    let body: HeartbeatRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.session_id !== auditId) {
      return new Response(
        JSON.stringify({ error: 'session_id does not match token' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Query mode: return audit status for pre-resume checks
    if (body.query) {
      const { data: audit, error: fetchError } = await supabase
        .from('audits')
        .select('status, credits_deducted, is_locked, error_message')
        .eq('id', auditId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !audit) {
        return new Response(
          JSON.stringify({ error: 'Audit not found' }),
          { status: 404, headers: corsHeaders }
        );
      }

      const resumable = audit.status === 'analyzing' && !audit.is_locked &&
        (audit.credits_deducted || 0) > 0;

      return new Response(
        JSON.stringify({
          status: audit.status,
          credits_deducted: audit.credits_deducted,
          is_locked: audit.is_locked,
          error_message: audit.error_message,
          resumable,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Heartbeat mode: update progress
    const updateData: Record<string, unknown> = {
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (body.contracts_completed !== undefined) {
      updateData.contracts_completed = body.contracts_completed;
    }
    if (body.contracts_total !== undefined) {
      updateData.contracts_total = body.contracts_total;
    }
    if (body.current_phase !== undefined) {
      updateData.current_phase = body.current_phase;
    }
    if (body.findings_count !== undefined) {
      updateData.findings_count = body.findings_count;
    }

    const { error: updateError } = await supabase
      .from('audits')
      .update(updateData)
      .eq('id', auditId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('cli-session-progress: Update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update progress' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-session-progress: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
