import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCallback } from '../_shared/verifyCallback.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = { 'Content-Type': 'application/json' };

interface FailRequest {
  audit_id?: string;
  sessionId?: string;
  error?: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('fail-audit: Request received');

  try {
    // Parse body first to get audit ID for per-audit auth fallback
    let body: FailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const auditId = body.audit_id || body.sessionId;
    if (!auditId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing audit_id or sessionId' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Dual auth: try service secret first, fall back to per-audit callback token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const serviceAuth = verifyServiceSecret(req);
    if (!serviceAuth) {
      const callbackAuth = await verifyCallback(req, auditId, supabase);
      if (!callbackAuth.valid) {
        console.error('fail-audit: Auth failed:', callbackAuth.error);
        return new Response(
          JSON.stringify({ success: false, error: callbackAuth.error }),
          { status: callbackAuth.status || 401, headers: corsHeaders }
        );
      }
    }

    const errorMsg = body.error || body.error_message || 'Audit failed';
    console.log(`fail-audit: Processing failure for audit ${auditId}: ${errorMsg}`);

    // Update audit_orchestration (idempotent — ignores zero-row result)
    await supabase
      .from('audit_orchestration')
      .update({
        status: 'failed',
        error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', auditId)
      .in('status', ['queued', 'running']);

    // Atomic CAS lock — only one caller (fail, cancel, or complete) gets through
    const { data: locked, error: lockError } = await supabase
      .from('audits')
      .update({
        status: 'failed',
        is_locked: true,
        credits_deducted: 0,
        error_message: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auditId)
      .eq('is_locked', false)
      .select('id, user_id, credits_deducted');

    if (lockError) {
      console.error('fail-audit: Lock update failed:', lockError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update audit status' }),
        { status: 500, headers: corsHeaders }
      );
    }

    let creditsRefunded = 0;

    if (locked && locked.length > 0) {
      const audit = locked[0];
      const creditsToRefund = audit.credits_deducted || 0;

      if (audit.user_id && creditsToRefund > 0) {
        const { error: refundError } = await supabase.rpc('cli_refund_credits', {
          p_user_id: audit.user_id,
          p_amount: creditsToRefund,
          p_audit_id: auditId,
          p_description: `Refund: Audit failed — ${errorMsg}`,
        });
        if (refundError) {
          console.error(
            `fail-audit: CRITICAL — refund of ${creditsToRefund} credits ` +
              `failed for user ${audit.user_id}, audit ${auditId}:`,
            refundError,
          );
        } else {
          creditsRefunded = creditsToRefund;
        }
      }

      console.log(`fail-audit: Audit ${auditId} locked and marked as failed`);
    } else {
      // Already locked (idempotent call)
      console.log(`fail-audit: Audit ${auditId} already locked, skipping`);
    }

    return new Response(
      JSON.stringify({ success: true, audit_id: auditId, credits_refunded: creditsRefunded }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('fail-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});