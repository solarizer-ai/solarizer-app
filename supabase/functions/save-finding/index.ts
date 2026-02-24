import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCallback } from '../_shared/verifyCallback.ts';

// No CORS headers - this is a server-to-server callback only
const corsHeaders = {
  'Content-Type': 'application/json',
};

type VerificationStatus = 'unverified' | 'verified' | 'downgraded' | 'false_positive';

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
  verification_status?: VerificationStatus;
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

const validVerificationStatuses: VerificationStatus[] = ['unverified', 'verified', 'downgraded', 'false_positive'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('save-finding: Request received');

  try {
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

    if (!finding || typeof finding !== 'object' || !finding.audit_id || typeof finding.audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authResult = await verifyCallback(req, finding.audit_id, supabase);
    if (!authResult.valid) {
      console.error('save-finding: Auth failed:', authResult.error);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status || 401, headers: corsHeaders }
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

    // Validate verification_status if provided
    const verificationStatus: VerificationStatus = finding.verification_status || 'unverified';
    if (!validVerificationStatuses.includes(verificationStatus)) {
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

    // Check if audit is locked
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

    // Check for duplicate finding by title + severity
    const { data: existingFindings, error: checkError } = await supabase
      .from('findings')
      .select('id, title, severity, description, location, code_snippet')
      .eq('audit_id', finding.audit_id)
      .eq('title', finding.title)
      .eq('severity', finding.severity);

    if (checkError) {
      console.error('save-finding: Error checking for duplicates:', checkError);
    }

    let findingId: string;
    let wasDuplicate = false;
    let wasUpdated = false;

    if (existingFindings && existingFindings.length > 0) {
      // Duplicate detected — UPDATE the existing finding with non-null fields
      wasDuplicate = true;
      findingId = existingFindings[0].id;

      const updateFields: Record<string, unknown> = {};
      if (finding.description) updateFields.description = finding.description;
      if (finding.location !== undefined) updateFields.location = finding.location || null;
      if (finding.line_start !== undefined) updateFields.line_start = finding.line_start;
      if (finding.line_end !== undefined) updateFields.line_end = finding.line_end;
      if (finding.code_snippet !== undefined) updateFields.code_snippet = finding.code_snippet || null;
      if (finding.remediation !== undefined) updateFields.remediation = finding.remediation || null;
      if (finding.verification_status) updateFields.verification_status = verificationStatus;

      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await supabase
          .from('findings')
          .update(updateFields)
          .eq('id', findingId);

        if (updateError) {
          console.error('save-finding: Failed to update duplicate finding:', updateError);
        } else {
          wasUpdated = true;
          console.log(`save-finding: Updated existing finding ${findingId} with ${Object.keys(updateFields).join(', ')}`);
        }
      } else {
        console.log(`save-finding: Duplicate finding detected, no new fields to update for "${finding.title}"`);
      }
    } else {
      // Insert new finding
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
          verification_status: verificationStatus,
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

      const { data: auditData, error: fetchError } = await supabase
        .from('audits')
        .select('coverage_data')
        .eq('id', finding.audit_id)
        .single();

      if (fetchError) {
        console.error('save-finding: Failed to fetch existing coverage_data:', fetchError);
      }

      let mergedCoverage = coverage_data;

      if (auditData?.coverage_data && typeof auditData.coverage_data === 'object') {
        const existingData = auditData.coverage_data as CoverageData;
        const existingDetails = existingData.details || [];
        const newDetails = coverage_data.details || [];

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
            was_duplicate: wasDuplicate,
            was_updated: wasUpdated,
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
        was_duplicate: wasDuplicate,
        was_updated: wasUpdated,
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
