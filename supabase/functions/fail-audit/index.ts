import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Validate callback secret
    const callbackSecret = req.headers.get('x-callback-secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret) {
      console.error('fail-audit: N8N_CALLBACK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    if (callbackSecret !== expectedSecret) {
      console.error('fail-audit: Invalid callback secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
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

    // Validate required fields
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

    console.log(`fail-audit: Processing failure for audit ${audit_id}${error_message ? `: ${error_message}` : ''}`);

    // Fetch audit to get user_id and nloc_count for refund
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('id, user_id, nloc_count, is_locked, status')
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

    // Get nloc_count for refund (default to 0 if null)
    const nlocToRefund = audit.nloc_count || 0;
    let creditsRefunded = 0;

    // Refund credits if there's an amount to refund
    if (nlocToRefund > 0) {
      console.log(`fail-audit: Refunding ${nlocToRefund} credits to user ${audit.user_id}`);
      
      const { data: refundResult, error: refundError } = await supabase
        .rpc('refund_credits', {
          p_user_id: audit.user_id,
          p_nloc_amount: nlocToRefund,
          p_is_starter: false // Doesn't matter for credit refund logic
        });

      if (refundError) {
        console.error('fail-audit: Failed to refund credits:', refundError);
        // Continue with status update even if refund fails
      } else if (refundResult?.success) {
        creditsRefunded = nlocToRefund;
        console.log(`fail-audit: Successfully refunded ${creditsRefunded} credits`);
      }
    }

    // Update audit status to failed and lock it
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'failed',
        is_locked: true,
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
        credits_refunded: creditsRefunded
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
