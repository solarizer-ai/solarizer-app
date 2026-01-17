import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-callback-secret',
};

interface FindingInput {
  audit_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  location?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  remediation?: string;
}

interface CoverageTestDetail {
  test_name: string;
  status: "PASSED" | "FAILED";
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

interface SaveFindingRequest {
  finding: FindingInput;
  coverage_data?: CoverageData;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('save-finding: Request received');

  try {
    // Validate callback secret
    const callbackSecret = req.headers.get('x-callback-secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret) {
      console.error('save-finding: N8N_CALLBACK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Callback authentication not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callbackSecret !== expectedSecret) {
      console.error('save-finding: Invalid callback secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: SaveFindingRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error('save-finding: Failed to parse request body', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { finding, coverage_data } = body;

    // Validate required fields
    if (!finding || typeof finding !== 'object') {
      return new Response(
        JSON.stringify({ error: 'finding object is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!finding.audit_id || typeof finding.audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'finding.audit_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!finding.title || typeof finding.title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'finding.title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    if (!validSeverities.includes(finding.severity)) {
      return new Response(
        JSON.stringify({ error: `Invalid severity: ${finding.severity}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!finding.description || typeof finding.description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'finding.description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate coverage_data if provided
    if (coverage_data !== undefined) {
      if (typeof coverage_data !== 'object' || coverage_data === null) {
        return new Response(
          JSON.stringify({ error: 'coverage_data must be an object' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (typeof coverage_data.total_tests !== 'number' ||
          typeof coverage_data.passed !== 'number' ||
          typeof coverage_data.failed !== 'number') {
        return new Response(
          JSON.stringify({ error: 'coverage_data requires total_tests, passed, and failed as numbers' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!Array.isArray(coverage_data.details)) {
        return new Response(
          JSON.stringify({ error: 'coverage_data.details must be an array' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`save-finding: Saving finding "${finding.title}" for audit ${finding.audit_id}`);

    // Insert the finding
    const { data, error } = await supabase
      .from('findings')
      .insert({
        audit_id: finding.audit_id,
        title: finding.title,
        severity: finding.severity,
        description: finding.description,
        location: finding.location || null,
        line_start: finding.line_start || null,
        line_end: finding.line_end || null,
        code_snippet: finding.code_snippet || null,
        remediation: finding.remediation || null,
        is_resolved: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('save-finding: Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save finding', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`save-finding: Successfully saved finding with id ${data.id}`);

    // Update audit with coverage_data if provided
    if (coverage_data) {
      console.log(`save-finding: Updating coverage_data for audit ${finding.audit_id}`);
      
      const { error: coverageError } = await supabase
        .from('audits')
        .update({
          coverage_data: coverage_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', finding.audit_id);

      if (coverageError) {
        console.error('save-finding: Failed to update coverage_data:', coverageError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            finding_id: data.id,
            coverage_updated: false,
            coverage_error: coverageError.message 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`save-finding: Coverage data updated successfully`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        finding_id: data.id,
        coverage_updated: coverage_data ? true : false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('save-finding: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
