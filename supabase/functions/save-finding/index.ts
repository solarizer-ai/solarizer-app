import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// No CORS headers - this is a server-to-server callback only
const corsHeaders = {
  'Content-Type': 'application/json',
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
  // Reject CORS preflight - this is server-to-server only
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('save-finding: Request received');

  try {
    // Validate callback secret
    const callbackSecret = req.headers.get('x-callback-secret');
    const expectedSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    
    if (!expectedSecret) {
      console.error('save-finding: N8N_CALLBACK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: corsHeaders }
      );
    }

    if (callbackSecret !== expectedSecret) {
      console.error('save-finding: Invalid callback secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    const { finding, coverage_data } = body;

    // Validate required fields
    if (!finding || typeof finding !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!finding.audit_id || typeof finding.audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!finding.title || typeof finding.title !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    if (!validSeverities.includes(finding.severity)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!finding.description || typeof finding.description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate coverage_data if provided
    if (coverage_data !== undefined) {
      if (typeof coverage_data !== 'object' || coverage_data === null) {
        return new Response(
          JSON.stringify({ error: 'Invalid request parameters' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      if (typeof coverage_data.total_tests !== 'number' ||
          typeof coverage_data.passed !== 'number' ||
          typeof coverage_data.failed !== 'number') {
        return new Response(
          JSON.stringify({ error: 'Invalid request parameters' }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      if (!Array.isArray(coverage_data.details)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request parameters' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if audit is locked before saving
    const { data: auditLockCheck, error: lockCheckError } = await supabase
      .from('audits')
      .select('is_locked')
      .eq('id', finding.audit_id)
      .single();

    if (lockCheckError) {
      console.error('save-finding: Failed to check audit lock status:', lockCheckError);
    }

    if (auditLockCheck?.is_locked) {
      console.log(`save-finding: Audit ${finding.audit_id} is locked, rejecting finding save`);
      return new Response(
        JSON.stringify({ error: 'Audit is locked', already_complete: true }),
        { status: 409, headers: corsHeaders }
      );
    }

    console.log(`save-finding: Checking for duplicate finding "${finding.title}" for audit ${finding.audit_id}`);

    // Check for duplicate finding - match by title, severity, description, and location
    const { data: existingFindings, error: checkError } = await supabase
      .from('findings')
      .select('id, title, severity, description, location, code_snippet')
      .eq('audit_id', finding.audit_id)
      .eq('title', finding.title)
      .eq('severity', finding.severity);

    if (checkError) {
      console.error('save-finding: Error checking for duplicates:', checkError);
    }

    // Check if an exact match exists (compare all relevant fields)
    const isDuplicate = existingFindings?.some((existing) => {
      const descMatch = existing.description === finding.description;
      const locMatch = (existing.location || null) === (finding.location || null);
      const snippetMatch = (existing.code_snippet || null) === (finding.code_snippet || null);
      return descMatch && locMatch && snippetMatch;
    });

    let findingId: string;

    if (isDuplicate) {
      console.log(`save-finding: Duplicate finding detected, skipping insert for "${finding.title}"`);
      findingId = existingFindings![0].id;
    } else {
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
          JSON.stringify({ error: 'Failed to save finding' }),
          { status: 500, headers: corsHeaders }
        );
      }

      findingId = data.id;
      console.log(`save-finding: Successfully saved new finding with id ${findingId}`);
    }

    

    // Update audit with coverage_data if provided - MERGE instead of overwrite
    if (coverage_data) {
      console.log(`save-finding: Merging coverage_data for audit ${finding.audit_id}`);
      
      // First, fetch existing coverage_data
      const { data: auditData, error: fetchError } = await supabase
        .from('audits')
        .select('coverage_data')
        .eq('id', finding.audit_id)
        .single();

      if (fetchError) {
        console.error('save-finding: Failed to fetch existing coverage_data:', fetchError);
      }

      // Merge coverage data
      let mergedCoverage = coverage_data;
      
      if (auditData?.coverage_data && typeof auditData.coverage_data === 'object') {
        const existingData = auditData.coverage_data as CoverageData;
        const existingDetails = existingData.details || [];
        const newDetails = coverage_data.details || [];
        
        // Create a map of existing tests by test_name + file to avoid duplicates
        const testMap = new Map<string, CoverageTestDetail>();
        existingDetails.forEach((test: CoverageTestDetail) => {
          const key = `${test.file}::${test.test_name}`;
          testMap.set(key, test);
        });
        
        // Add/update with new tests
        newDetails.forEach((test: CoverageTestDetail) => {
          const key = `${test.file}::${test.test_name}`;
          testMap.set(key, test); // Overwrites if same test, adds if new
        });
        
        const mergedDetails = Array.from(testMap.values());
        const passed = mergedDetails.filter((t: CoverageTestDetail) => t.status === 'PASSED').length;
        const failed = mergedDetails.filter((t: CoverageTestDetail) => t.status === 'FAILED').length;
        
        mergedCoverage = {
          total_tests: mergedDetails.length,
          passed,
          failed,
          details: mergedDetails,
        };
        
        console.log(`save-finding: Merged ${existingDetails.length} existing + ${newDetails.length} new = ${mergedDetails.length} total tests`);
      }
      
      const { error: coverageError } = await supabase
        .from('audits')
        .update({
          coverage_data: mergedCoverage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', finding.audit_id);

      if (coverageError) {
        console.error('save-finding: Failed to update coverage_data:', coverageError);
        return new Response(
          JSON.stringify({ 
            success: true, 
            finding_id: findingId,
            coverage_updated: false,
          }),
          { status: 200, headers: corsHeaders }
        );
      }
      
      console.log(`save-finding: Coverage data merged and updated successfully`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        finding_id: findingId,
        coverage_updated: coverage_data ? true : false,
        was_duplicate: isDuplicate ? true : false
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('save-finding: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
