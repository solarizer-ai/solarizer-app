import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Checking for stale audits...');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate 48 hours ago
    const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`Looking for audits older than: ${staleThreshold}`);

    // Find stale audits (analyzing for more than 48 hours)
    const { data: staleAudits, error: fetchError } = await supabaseClient
      .from('audits')
      .select('id, user_id, nloc_count')
      .eq('status', 'analyzing')
      .lt('updated_at', staleThreshold);

    if (fetchError) {
      console.error('Error fetching stale audits:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${staleAudits?.length || 0} stale audits`);

    let refundedCount = 0;
    const processedAudits: string[] = [];

    for (const audit of staleAudits || []) {
      console.log(`Processing stale audit: ${audit.id}`);

      try {
        // Get user's subscription plan to determine if we should refund scan count
        const { data: subscription } = await supabaseClient
          .from('subscriptions')
          .select('plan')
          .eq('user_id', audit.user_id)
          .maybeSingle();

        const isStarter = subscription?.plan === 'starter';
        console.log(`User ${audit.user_id} is on ${isStarter ? 'starter' : 'pro'} plan`);

        // Refund credits if NLOC was consumed
        if (audit.nloc_count && audit.nloc_count > 0) {
          const { data: refundResult, error: refundError } = await supabaseClient.rpc('refund_credits', {
            p_user_id: audit.user_id,
            p_nloc_amount: audit.nloc_count,
            p_is_starter: isStarter,
          });

          if (refundError) {
            console.error(`Error refunding credits for audit ${audit.id}:`, refundError);
          } else {
            console.log(`Refunded ${audit.nloc_count} NLOC for audit ${audit.id}:`, refundResult);
            refundedCount++;
          }
        }

        // Mark audit as failed
        const { error: updateError } = await supabaseClient
          .from('audits')
          .update({ 
            status: 'failed', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', audit.id);

        if (updateError) {
          console.error(`Error updating audit ${audit.id} to failed:`, updateError);
        } else {
          console.log(`Marked audit ${audit.id} as failed`);
          processedAudits.push(audit.id);
        }
      } catch (auditError) {
        console.error(`Error processing audit ${audit.id}:`, auditError);
      }
    }

    const result = {
      success: true,
      processed: processedAudits.length,
      refunded: refundedCount,
      audits: processedAudits,
    };

    console.log('Stale audit check complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-stale-audits:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
