import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCallback } from '../_shared/verifyCallback.ts';

// No CORS headers - this is a server-to-server callback only
const corsHeaders = {
  'Content-Type': 'application/json',
};

interface FailAuditRequest {
  audit_id: string;
  error_message?: string;
}

Deno.serve(async (req) => {
  // Reject CORS preflight - this is server-to-server only
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('fail-audit: Request received');

  try {
    // Parse request body first to get audit_id for per-audit auth
    let body: FailAuditRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error('fail-audit: Failed to parse request body', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { audit_id, error_message } = body;

    if (!audit_id || typeof audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'audit_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify per-audit callback token (with legacy fallback)
    const authResult = await verifyCallback(req, audit_id, supabase);
    if (!authResult.valid) {
      console.error('fail-audit: Auth failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 401, headers: corsHeaders }
      );
    }

    console.log(`fail-audit: Processing failure for audit ${audit_id}${error_message ? `: ${error_message}` : ''}`);

    // Fetch audit to get user_id and credit info for release
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('id, user_id, credits_reserved, credits_deducted, is_locked, status')
      .eq('id', audit_id)
      .single();

    if (fetchError || !audit) {
      console.error('fail-audit: Audit not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already locked (idempotency)
    if (audit.is_locked) {
      console.log(`fail-audit: Audit ${audit_id} is already locked, skipping`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          audit_id,
          already_locked: true,
          credits_refunded: 0
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Release reserved credits (backwards-compat: fall back to credits_deducted)
    const amountToRelease = audit.credits_reserved || audit.credits_deducted || 0;
    let creditsReleased = 0;

    if (amountToRelease > 0) {
      console.log(`fail-audit: Releasing ${amountToRelease} credits to user ${audit.user_id}`);
      
      const { data: releaseResult, error: releaseError } = await supabase
        .rpc('cli_release_credits', {
          p_user_id: audit.user_id,
          p_amount: amountToRelease,
          p_audit_id: audit_id,
          p_description: 'Full release: proxy failure',
        });

      if (releaseError) {
        console.error('fail-audit: Failed to release credits:', releaseError);
        // Continue with status update even if release fails
      } else if (releaseResult?.success) {
        creditsReleased = amountToRelease;
        console.log(`fail-audit: Successfully released ${creditsReleased} credits`);
      }
    }

    // Update audit status to failed and lock it
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'failed',
        is_locked: true,
        credits_reserved: 0,
        error_message: error_message || 'Proxy failure',
        updated_at: new Date().toISOString(),
      })
      .eq('id', audit_id);

    if (updateError) {
      console.error('fail-audit: Failed to update audit status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update audit status' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`fail-audit: Successfully marked audit ${audit_id} as failed and locked`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit_id,
        credits_refunded: creditsReleased
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('fail-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
