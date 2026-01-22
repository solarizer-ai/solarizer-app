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
  scope?: string[];  // In-scope file names for audit
  additional_context?: string;
  metadata: {
    nloc_count: number;
    contract_count: number;
    plan: 'starter' | 'pro';
  };
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

    // Sanitize file name (prevent path traversal and shell-unsafe characters)
    const sanitizedName = file.name
      .replace(/\.\./g, '')           // Remove path traversal
      .replace(/^\/+/, '')            // Remove leading slashes
      .replace(/\\/g, '/')            // Normalize backslashes
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/[<>:"|?*]/g, '_');    // Replace shell-unsafe characters

    sanitizedFiles.push({
      name: sanitizedName,
      content: file.content,
    });
  }

  return { valid: true, sanitizedFiles };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('run-audit: Request received');

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('run-audit: Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('run-audit: Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('run-audit: Invalid authentication token', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`run-audit: Authenticated user: ${userId}`);
    // ===== END AUTHENTICATION CHECK =====

    const webhookUrl = Deno.env.get('N8N_AUDIT_WEBHOOK_URL');
    if (!webhookUrl) {
      console.error('run-audit: N8N_AUDIT_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get callback secret for n8n to use
    const callbackSecret = Deno.env.get('N8N_CALLBACK_SECRET');
    if (!callbackSecret) {
      console.error('run-audit: N8N_CALLBACK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const { audit_id, project_name, files, scope, additional_context, metadata } = body;

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

    // ===== AUTHORIZATION CHECK: Verify audit ownership =====
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('user_id')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      console.error('run-audit: Audit not found', auditError);
      return new Response(
        JSON.stringify({ error: 'Audit not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (audit.user_id !== userId) {
      console.error(`run-audit: User ${userId} attempted to access audit owned by ${audit.user_id}`);
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTHORIZATION CHECK =====

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

    // Construct callback URLs for n8n
    const saveFindingUrl = `${supabaseUrl}/functions/v1/save-finding`;
    const completeAuditUrl = `${supabaseUrl}/functions/v1/complete-audit`;

    // Fire-and-forget: Send to n8n without waiting for response
    console.log('run-audit: Triggering n8n audit engine (fire-and-forget)...');
    
    // Use fetch without await - fire and forget
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audit_id,
        project_name,
        files: validation.sanitizedFiles,
        scope: scope || validation.sanitizedFiles!.map(f => f.name),  // Default to all files if not specified
        additional_context: additional_context || '',
        metadata,
        // Include callback info for n8n to save findings incrementally
        callbacks: {
          save_finding_url: saveFindingUrl,
          complete_audit_url: completeAuditUrl,
          secret: callbackSecret,
        },
      }),
    }).then(response => {
      console.log(`run-audit: n8n webhook triggered, response status: ${response.status}`);
    }).catch(error => {
      console.error('run-audit: Error triggering n8n webhook:', error);
    });

    // Immediately return success - n8n will process in background and call back
    console.log(`run-audit: Returning immediately - n8n will process in background`);

    return new Response(
      JSON.stringify({ 
        status: 'started',
        audit_id,
        message: 'Audit started. Results will be saved incrementally via realtime updates.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('run-audit: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
