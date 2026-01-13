import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret',
};

interface CompleteAuditRequest {
  audit_id: string;
  security_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'secured' | 'issues';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('complete-audit: Request received');

  try {
    // Validate callback secret
    const callbackSecret = req.headers.get('x-callback-secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret) {
      console.error('complete-audit: N8N_CALLBACK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Callback authentication not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callbackSecret !== expectedSecret) {
      console.error('complete-audit: Invalid callback secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: CompleteAuditRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error('complete-audit: Failed to parse request body', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audit_id, security_score, grade, status } = body;

    // Validate required fields
    if (!audit_id || typeof audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'audit_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof security_score !== 'number' || security_score < 0 || security_score > 100) {
      return new Response(
        JSON.stringify({ error: 'security_score must be a number between 0 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!validGrades.includes(grade)) {
      return new Response(
        JSON.stringify({ error: `Invalid grade: ${grade}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['secured', 'issues'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status: ${status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`complete-audit: Completing audit ${audit_id} with score ${security_score}, grade ${grade}, status ${status}`);

    // Update the audit
    const { data, error } = await supabase
      .from('audits')
      .update({
        security_score,
        grade,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', audit_id)
      .select('id')
      .single();

    if (error) {
      console.error('complete-audit: Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to complete audit', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      console.error('complete-audit: Audit not found');
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`complete-audit: Successfully completed audit ${audit_id}`);

    return new Response(
      JSON.stringify({ success: true, audit_id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('complete-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
