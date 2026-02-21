import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCallback } from '../_shared/verifyCallback.ts';

// No CORS headers - this is a server-to-server callback only
const corsHeaders = {
  'Content-Type': 'application/json',
};

// Types for grading logic
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

// Calculate grade based on highest severity finding
function calculateGradeFromFindings(severities: Severity[]): Grade {
  if (severities.includes('critical')) return 'F';
  if (severities.includes('high')) return 'D';
  if (severities.includes('medium')) return 'C';
  if (severities.includes('low')) return 'B';
  return 'A'; // Only info or no findings
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

interface CompleteAuditRequest {
  audit_id: string;
  security_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'secured' | 'issues';
  coverage_data?: CoverageData;
  system_hologram?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Reject CORS preflight - this is server-to-server only
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('complete-audit: Request received');

  try {
    // Parse request body first to get audit_id for per-audit auth
    let body: CompleteAuditRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error('complete-audit: Failed to parse request body', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { audit_id, security_score, grade, status, coverage_data, system_hologram } = body;

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
      console.error('complete-audit: Auth failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 401, headers: corsHeaders }
      );
    }

    // Validate remaining fields
    if (typeof security_score !== 'number' || security_score < 0 || security_score > 100) {
      return new Response(
        JSON.stringify({ error: 'security_score must be a number between 0 and 100' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!validGrades.includes(grade)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const validStatuses = ['secured', 'issues'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate coverage_data structure if provided
    if (coverage_data) {
      if (typeof coverage_data.total_tests !== 'number' ||
          typeof coverage_data.passed !== 'number' ||
          typeof coverage_data.failed !== 'number' ||
          !Array.isArray(coverage_data.details)) {
        return new Response(
          JSON.stringify({ error: 'Invalid coverage_data structure' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // supabase client already initialized above

    console.log(`complete-audit: Completing audit ${audit_id} with score ${security_score}, incoming grade ${grade}, status ${status}, coverage_tests: ${coverage_data?.total_tests ?? 0}`);

    // Check if audit is already locked (idempotency)
    const { data: auditCheck, error: checkError } = await supabase
      .from('audits')
      .select('is_locked')
      .eq('id', audit_id)
      .single();

    if (checkError) {
      console.error('complete-audit: Failed to check audit lock status:', checkError);
    }

    if (auditCheck?.is_locked) {
      console.log(`complete-audit: Audit ${audit_id} is already locked, rejecting update`);
      return new Response(
        JSON.stringify({ error: 'Audit is locked', already_complete: true }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Query all findings for this audit to calculate grade
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('severity')
      .eq('audit_id', audit_id);

    if (findingsError) {
      console.error('complete-audit: Failed to fetch findings:', findingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate grade' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Calculate grade from findings (overrides incoming grade)
    const severities = (findings || []).map(f => f.severity as Severity);
    const calculatedGrade = calculateGradeFromFindings(severities);

    console.log(`complete-audit: Calculated grade ${calculatedGrade} from ${findings?.length ?? 0} findings (severities: ${severities.join(', ') || 'none'})`);

    // Build update object - only include optional fields if explicitly provided
    const updateData: Record<string, unknown> = {
      security_score,
      grade: calculatedGrade,  // Use calculated grade, not incoming
      status,
      is_locked: true,  // Lock the audit on completion
      updated_at: new Date().toISOString(),
    };

    // Only update coverage_data if explicitly provided - MERGE with existing
    if (coverage_data !== undefined) {
      console.log(`complete-audit: Merging coverage_data for audit ${audit_id}`);
      
      // Fetch existing coverage_data
      const { data: existingAudit, error: fetchError } = await supabase
        .from('audits')
        .select('coverage_data')
        .eq('id', audit_id)
        .single();
      
      if (fetchError) {
        console.error('complete-audit: Failed to fetch existing coverage_data:', fetchError);
      }
      
      if (existingAudit?.coverage_data && typeof existingAudit.coverage_data === 'object') {
        const existingData = existingAudit.coverage_data as CoverageData;
        const existingDetails = existingData.details || [];
        const newDetails = coverage_data.details || [];
        
        // Merge using test_name + file as unique key
        const testMap = new Map<string, CoverageTestDetail>();
        existingDetails.forEach((test: CoverageTestDetail) => {
          const key = `${test.file}::${test.test_name}`;
          testMap.set(key, test);
        });
        newDetails.forEach((test: CoverageTestDetail) => {
          const key = `${test.file}::${test.test_name}`;
          testMap.set(key, test);
        });
        
        const mergedDetails = Array.from(testMap.values());
        const passed = mergedDetails.filter((t: CoverageTestDetail) => t.status === 'PASSED').length;
        const failed = mergedDetails.filter((t: CoverageTestDetail) => t.status === 'FAILED').length;
        
        updateData.coverage_data = {
          total_tests: mergedDetails.length,
          passed,
          failed,
          details: mergedDetails,
        };
        
        console.log(`complete-audit: Merged ${existingDetails.length} existing + ${newDetails.length} new = ${mergedDetails.length} total tests`);
      } else {
        updateData.coverage_data = coverage_data;
      }
    }

    // Merge system_hologram to preserve scope/all_files from run-audit
    if (system_hologram !== undefined) {
      console.log(`complete-audit: Processing system_hologram for audit ${audit_id}`);
      
      // Fetch existing system_hologram to preserve scope metadata
      const { data: hologramAudit, error: hologramFetchError } = await supabase
        .from('audits')
        .select('system_hologram')
        .eq('id', audit_id)
        .single();
      
      if (hologramFetchError) {
        console.error('complete-audit: Failed to fetch existing system_hologram:', hologramFetchError);
      }
      
      const existingHologram = (hologramAudit?.system_hologram as Record<string, unknown>) || {};
      
      // Check for exact duplicate - skip if incoming matches what we already have
      const incomingKeys = Object.keys(system_hologram);
      const isExactDuplicate = incomingKeys.length > 0 && incomingKeys.every(key => {
        return JSON.stringify(existingHologram[key]) === JSON.stringify(system_hologram[key]);
      });
      
      if (isExactDuplicate) {
        console.log('complete-audit: Skipping system_hologram update - exact duplicate detected');
      } else {
        // Merge: preserve existing scope/all_files, add new analysis data
        updateData.system_hologram = {
          ...existingHologram,    // Keeps scope, all_files
          ...system_hologram,     // Adds/updates contracts, entry_points, etc.
        };
        console.log(`complete-audit: Merged system_hologram - preserved ${Object.keys(existingHologram).length} existing keys, added ${incomingKeys.length} incoming keys`);
      }
    }

    console.log(`complete-audit: Updating with fields: ${Object.keys(updateData).join(', ')}`);

    // Update the audit
    const { data, error } = await supabase
      .from('audits')
      .update(updateData)
      .eq('id', audit_id)
      .select('id')
      .single();

    if (error) {
      console.error('complete-audit: Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to complete audit' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!data) {
      console.error('complete-audit: Audit not found');
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`complete-audit: Successfully completed audit ${audit_id}`);

    return new Response(
      JSON.stringify({ success: true, audit_id: data.id }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('complete-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
