import { createServiceClient } from '../_shared/apiKeyAuth.ts';
import { decode as base64urlDecode } from 'https://deno.land/std@0.208.0/encoding/base64url.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
};

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface CoverageTestDetail {
  test_name: string;
  status: 'PASSED' | 'FAILED';
  proof: string | null;
  file: string;
  related_finding_title: string | null;
}

interface CoverageData {
  total_tests: number;
  passed: number;
  failed: number;
  details: CoverageTestDetail[];
}

interface SessionEndRequest {
  session_id: string;
  status: 'completed' | 'failed' | 'cancelled';
  total_findings?: number;
  critical_count?: number;
  high_count?: number;
  security_score?: number;
  grade?: Grade;
  coverage_data?: CoverageData;
  system_hologram?: Record<string, unknown>;
  contracts_completed?: number;
  contracts_total?: number;
  error_message?: string;
}

function calculateGradeFromFindings(severities: Severity[]): Grade {
  if (severities.includes('critical')) return 'F';
  if (severities.includes('high')) return 'D';
  if (severities.includes('medium')) return 'C';
  if (severities.includes('low')) return 'B';
  return 'A';
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

  console.log('cli-session-end: Request received');

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
      console.error('cli-session-end: SESSION_SECRET not configured');
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

    let body: SessionEndRequest;
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

    const validStatuses = ['completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: 'status must be completed, failed, or cancelled' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, user_id, is_locked, credits_deducted, credits_reserved, contracts_completed, contracts_total')
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
        JSON.stringify({ success: true, already_locked: true, credits_refunded: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    let creditsRefunded = 0;
    let creditsCommitted = 0;

    if (body.status === 'completed') {
      const { data: findings } = await supabase
        .from('findings')
        .select('severity')
        .eq('audit_id', sessionId)
        .neq('verification_status', 'false_positive');

      const severities = (findings || []).map(f => f.severity as Severity);
      const calculatedGrade = calculateGradeFromFindings(severities);

      const updateData: Record<string, unknown> = {
        status: severities.some(s => s === 'critical' || s === 'high' || s === 'medium') ? 'issues' : 'secured',
        security_score: body.security_score ?? 0,
        grade: calculatedGrade,
        is_locked: true,
        contracts_completed: body.contracts_completed ?? audit.contracts_completed,
        contracts_total: body.contracts_total ?? audit.contracts_total,
        last_heartbeat: null,
        credits_reserved: 0,
        updated_at: new Date().toISOString(),
      };

      // Credit settlement for completed audits
      const creditsReserved = audit.credits_reserved || 0;
      if (creditsReserved > 0) {
        await supabase.rpc('cli_commit_credits', {
          p_user_id: userId,
          p_amount: creditsReserved,
          p_audit_id: sessionId,
          p_description: `Committed: audit completed`,
        });
        creditsCommitted = creditsReserved;
      }

      if (body.coverage_data) {
        const { data: existingAudit } = await supabase
          .from('audits')
          .select('coverage_data')
          .eq('id', sessionId)
          .single();

        if (existingAudit?.coverage_data && typeof existingAudit.coverage_data === 'object') {
          const existingData = existingAudit.coverage_data as CoverageData;
          const testMap = new Map<string, CoverageTestDetail>();
          (existingData.details || []).forEach((t: CoverageTestDetail) => testMap.set(`${t.file}::${t.test_name}`, t));
          (body.coverage_data.details || []).forEach((t: CoverageTestDetail) => testMap.set(`${t.file}::${t.test_name}`, t));
          const merged = Array.from(testMap.values());
          updateData.coverage_data = {
            total_tests: merged.length,
            passed: merged.filter((t: CoverageTestDetail) => t.status === 'PASSED').length,
            failed: merged.filter((t: CoverageTestDetail) => t.status === 'FAILED').length,
            details: merged,
          };
        } else {
          updateData.coverage_data = body.coverage_data;
        }
      }

      if (body.system_hologram) {
        const { data: hologramAudit } = await supabase
          .from('audits')
          .select('system_hologram')
          .eq('id', sessionId)
          .single();
        const existing = (hologramAudit?.system_hologram as Record<string, unknown>) || {};
        updateData.system_hologram = { ...existing, ...body.system_hologram };
      }

      await supabase.from('audits').update(updateData).eq('id', sessionId);

    } else {
      const creditsReserved = audit.credits_reserved || 0;
      const creditsDeducted = audit.credits_deducted || 0;
      const contractsCompleted = body.contracts_completed ?? audit.contracts_completed ?? 0;
      const contractsTotal = body.contracts_total ?? audit.contracts_total ?? 1;

      if (creditsReserved > 0) {
        // New reserve+commit path
        if (contractsTotal > 0 && contractsCompleted > 0) {
          const commitRatio = contractsCompleted / contractsTotal;
          const commitAmount = Math.round(creditsReserved * commitRatio * 100) / 100;
          const releaseAmount = Math.round((creditsReserved - commitAmount) * 100) / 100;

          if (commitAmount > 0) {
            await supabase.rpc('cli_commit_credits', {
              p_user_id: userId,
              p_amount: commitAmount,
              p_audit_id: sessionId,
              p_description: `Committed (${body.status}): ${contractsCompleted}/${contractsTotal} contracts`,
            });
            creditsCommitted = commitAmount;
          }
          if (releaseAmount > 0) {
            await supabase.rpc('cli_release_credits', {
              p_user_id: userId,
              p_amount: releaseAmount,
              p_audit_id: sessionId,
              p_description: `Released (${body.status}): ${contractsCompleted}/${contractsTotal} contracts`,
            });
            creditsRefunded = releaseAmount;
          }
        } else {
          // No contracts completed — release everything
          await supabase.rpc('cli_release_credits', {
            p_user_id: userId,
            p_amount: creditsReserved,
            p_audit_id: sessionId,
            p_description: `Full release (${body.status}): 0 contracts processed`,
          });
          creditsRefunded = creditsReserved;
        }
      } else if (creditsDeducted > 0 && contractsTotal > 0) {
        // Backwards-compat: pre-migration audits using old deduct+refund path
        const unprocessedRatio = Math.max(0, contractsTotal - contractsCompleted) / contractsTotal;
        creditsRefunded = Math.round(creditsDeducted * unprocessedRatio * 100) / 100;

        if (creditsRefunded > 0) {
          await supabase.rpc('cli_refund_credits', {
            p_user_id: userId,
            p_amount: creditsRefunded,
            p_audit_id: sessionId,
            p_description: `Refund (${body.status}): ${contractsCompleted}/${contractsTotal} contracts processed`,
          });
        }
      }

      await supabase.from('audits').update({
        status: 'failed',
        is_locked: true,
        error_message: body.error_message || `Audit ${body.status}`,
        contracts_completed: contractsCompleted,
        contracts_total: contractsTotal,
        last_heartbeat: null,
        credits_reserved: 0,
        updated_at: new Date().toISOString(),
      }).eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({ success: true, credits_refunded: creditsRefunded, credits_committed: creditsCommitted }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-session-end: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
