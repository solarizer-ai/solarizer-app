import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileInput {
  name: string;
  content: string;
}

interface AuditRequest {
  audit_id: string;
  project_name: string;
  files: FileInput[];
  metadata: {
    nloc_count: number;
    contract_count: number;
    plan: 'starter' | 'pro';
  };
}

interface Finding {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  location?: string;
  line_start?: number;
  line_end?: number;
  code_snippet?: string;
  remediation?: string;
}

interface N8nResponse {
  security_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'secured' | 'issues';
  findings: Finding[];
}

// Validate and sanitize files (same logic as cloc-estimate)
function validateFiles(files: FileInput[]): { valid: boolean; error?: string; sanitizedFiles?: FileInput[] } {
  if (!Array.isArray(files)) {
    return { valid: false, error: 'Files must be an array' };
  }

  if (files.length === 0) {
    return { valid: false, error: 'At least one file is required' };
  }

  if (files.length > 500) {
    return { valid: false, error: 'Maximum 500 files allowed' };
  }

  const sanitizedFiles: FileInput[] = [];

  for (const file of files) {
    if (!file.name || typeof file.name !== 'string') {
      return { valid: false, error: 'Each file must have a valid name' };
    }

    if (typeof file.content !== 'string') {
      return { valid: false, error: 'Each file must have string content' };
    }

    // Check file name length
    if (file.name.length > 500) {
      return { valid: false, error: 'File name too long' };
    }

    // Check content size (max 1MB per file)
    if (file.content.length > 1024 * 1024) {
      return { valid: false, error: `File ${file.name} exceeds 1MB limit` };
    }

    // Sanitize file name (prevent path traversal)
    const sanitizedName = file.name
      .replace(/\.\./g, '')
      .replace(/^\/+/, '')
      .replace(/\\/g, '/');

    sanitizedFiles.push({
      name: sanitizedName,
      content: file.content,
    });
  }

  return { valid: true, sanitizedFiles };
}

// Validate n8n response structure
function validateN8nResponse(data: unknown): { valid: boolean; error?: string; response?: N8nResponse } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format from audit engine' };
  }

  const response = data as Record<string, unknown>;

  if (typeof response.security_score !== 'number' || response.security_score < 0 || response.security_score > 100) {
    return { valid: false, error: 'Invalid security_score in response' };
  }

  const validGrades = ['A', 'B', 'C', 'D', 'F'];
  if (!validGrades.includes(response.grade as string)) {
    return { valid: false, error: 'Invalid grade in response' };
  }

  const validStatuses = ['secured', 'issues'];
  if (!validStatuses.includes(response.status as string)) {
    return { valid: false, error: 'Invalid status in response' };
  }

  if (!Array.isArray(response.findings)) {
    return { valid: false, error: 'Invalid findings array in response' };
  }

  // Validate each finding
  const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
  for (const finding of response.findings) {
    if (typeof finding !== 'object' || !finding) {
      return { valid: false, error: 'Invalid finding object' };
    }

    if (typeof finding.title !== 'string' || !finding.title) {
      return { valid: false, error: 'Each finding must have a title' };
    }

    if (!validSeverities.includes(finding.severity)) {
      return { valid: false, error: `Invalid severity: ${finding.severity}` };
    }

    if (typeof finding.description !== 'string') {
      return { valid: false, error: 'Each finding must have a description' };
    }
  }

  return {
    valid: true,
    response: {
      security_score: response.security_score as number,
      grade: response.grade as N8nResponse['grade'],
      status: response.status as N8nResponse['status'],
      findings: response.findings as Finding[],
    },
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('run-audit: Request received');

  try {
    const webhookUrl = Deno.env.get('N8N_AUDIT_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('run-audit: N8N_AUDIT_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Audit engine not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: AuditRequest;
    try {
      body = await req.json();
    } catch (e) {
      console.error('run-audit: Failed to parse request body', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audit_id, project_name, files, metadata } = body;

    // Validate required fields
    if (!audit_id || typeof audit_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'audit_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!project_name || typeof project_name !== 'string') {
      return new Response(
        JSON.stringify({ error: 'project_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!metadata || typeof metadata !== 'object') {
      return new Response(
        JSON.stringify({ error: 'metadata is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize files
    const validation = validateFiles(files);
    if (!validation.valid) {
      console.error('run-audit: File validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`run-audit: Processing audit ${audit_id} for project "${project_name}" with ${validation.sanitizedFiles!.length} files`);
    console.log(`run-audit: Metadata - NLOC: ${metadata.nloc_count}, Contracts: ${metadata.contract_count}, Plan: ${metadata.plan}`);

    // Call n8n webhook with NO TIMEOUT - let it take as long as needed
    console.log('run-audit: Calling n8n audit engine (no timeout)...');
    
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audit_id,
        project_name,
        files: validation.sanitizedFiles,
        metadata,
      }),
    });

    console.log(`run-audit: n8n response status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('run-audit: n8n returned error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Audit engine error', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate n8n response
    let n8nData: unknown;
    try {
      n8nData = await n8nResponse.json();
    } catch (e) {
      console.error('run-audit: Failed to parse n8n response as JSON', e);
      return new Response(
        JSON.stringify({ error: 'Invalid response from audit engine' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseValidation = validateN8nResponse(n8nData);
    if (!responseValidation.valid) {
      console.error('run-audit: Invalid n8n response structure:', responseValidation.error);
      return new Response(
        JSON.stringify({ error: responseValidation.error }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`run-audit: Audit complete - Score: ${responseValidation.response!.security_score}, Grade: ${responseValidation.response!.grade}, Findings: ${responseValidation.response!.findings.length}`);

    return new Response(
      JSON.stringify(responseValidation.response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('run-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
