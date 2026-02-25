import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCallback } from '../_shared/verifyCallback.ts';
import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';

const corsHeaders = {
  'Content-Type': 'application/json',
};

type VerificationStatus = 'verified' | 'downgraded' | 'false_positive';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface UpdateEntry {
  finding_id: string;
  verification_status?: VerificationStatus;
  severity?: Severity;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  description?: string;
  impact?: string;
  remediation?: string;
  function?: string;
}

interface UpdateRequest {
  audit_id: string;
  updates: UpdateEntry[];
}

const validVerificationStatuses = ['verified', 'downgraded', 'false_positive'];
const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 403 });
  }

  console.log('update-findings-batch: Request received');

  try {
    let body: UpdateRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { audit_id, updates } = body;

    if (!audit_id || typeof audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'audit_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'updates array is required and must not be empty' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const serviceAuth = verifyServiceSecret(req);
    if (!serviceAuth) {
      const authResult = await verifyCallback(req, audit_id, supabase);
      if (!authResult.valid) {
        console.error('update-findings-batch: Auth failed:', authResult.error);
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status || 401, headers: corsHeaders }
        );
      }
    }

    // Check audit lock
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('is_locked')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (audit.is_locked) {
      return new Response(
        JSON.stringify({ error: 'Audit is locked', already_complete: true }),
        { status: 409, headers: corsHeaders }
      );
    }

    let updatedCount = 0;

    for (const entry of updates) {
      if (!entry.finding_id || typeof entry.finding_id !== 'string') {
        continue;
      }

      const fields: Record<string, unknown> = {};

      if (entry.verification_status !== undefined) {
        if (!validVerificationStatuses.includes(entry.verification_status)) continue;
        fields.verification_status = entry.verification_status;
      }
      if (entry.severity !== undefined) {
        if (!validSeverities.includes(entry.severity)) continue;
        fields.severity = entry.severity;
      }
      if (entry.line_start !== undefined) fields.line_start = entry.line_start;
      if (entry.line_end !== undefined) fields.line_end = entry.line_end;
      if (entry.code_snippet !== undefined) fields.code_snippet = entry.code_snippet;
      if (entry.description !== undefined) fields.description = entry.description;
      if (entry.impact !== undefined) fields.impact = entry.impact;
      if (entry.remediation !== undefined) fields.remediation = entry.remediation;
      if (entry.function !== undefined) fields.function = entry.function;

      if (Object.keys(fields).length === 0) continue;

      const { error } = await supabase
        .from('findings')
        .update(fields)
        .eq('id', entry.finding_id)
        .eq('audit_id', audit_id);

      if (error) {
        console.error(`update-findings-batch: Failed to update finding ${entry.finding_id}:`, error);
      } else {
        updatedCount++;
      }
    }

    console.log(`update-findings-batch: Updated ${updatedCount}/${updates.length} findings for audit ${audit_id}`);

    return new Response(
      JSON.stringify({ success: true, updated_count: updatedCount }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('update-findings-batch: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
