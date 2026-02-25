import { validateApiKey, createServiceClient } from '../_shared/apiKeyAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Content-Type': 'application/json',
};

interface ScopeFile {
  path: string;
  nLOC: number;
  complexity: 'L1' | 'L2' | 'L3';
  content: string;
}

interface ContextFile {
  path: string;
  nLOC: number;
  content: string;
}

interface AuditStartRequest {
  projectName: string;
  scopeFiles: ScopeFile[];
  contextFiles: ContextFile[];
  additionalContext: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('cli-audit-start: Request received');

  try {
    const supabase = createServiceClient();

    // 1. Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing x-api-key header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const authResult = await validateApiKey(apiKey, supabase);
    if (!authResult.valid || !authResult.userId) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Invalid API key' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = authResult.userId;
    console.log(`cli-audit-start: Authenticated user ${userId}`);

    // 2. Parse request body
    let body: AuditStartRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { projectName, scopeFiles, contextFiles, additionalContext } = body;

    if (!Array.isArray(scopeFiles) || scopeFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'scopeFiles must be a non-empty array' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Check for existing running audit (prevent duplicates)
    const { data: existingAudits } = await supabase
      .from('audit_orchestration')
      .select('session_id, status')
      .eq('user_id', userId)
      .in('status', ['queued', 'running']);

    if (existingAudits && existingAudits.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'An audit is already running',
          sessionId: existingAudits[0].session_id,
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // 4. Get user tier and check credits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const tier = subscription?.plan || 'free';

    const { data: credits } = await supabase
      .from('nloc_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    // Calculate estimated cost with per-contract complexity multipliers
    const COMPLEXITY_RATES: Record<string, number> = { L1: 0.8, L2: 1.0, L3: 1.2 };
    const scopeNloc = scopeFiles.reduce((sum: number, f: ScopeFile) => sum + f.nLOC, 0);
    const scopeCost = scopeFiles.reduce((sum: number, f: ScopeFile) => {
      const rate = COMPLEXITY_RATES[f.complexity] ?? 1.0;
      return sum + f.nLOC * rate;
    }, 0);
    const contextNloc = (contextFiles || []).reduce((sum: number, f: ContextFile) => sum + f.nLOC, 0);
    const estimatedCost = Math.ceil(scopeCost + contextNloc * 0.15);

    const creditsRemaining = credits?.credits_remaining || 0;
    if (creditsRemaining < estimatedCost) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          credits_remaining: creditsRemaining,
          credits_required: estimatedCost,
        }),
        { status: 402, headers: corsHeaders }
      );
    }

    // 5. Reserve credits
    const { data: reserveResult, error: reserveError } = await supabase.rpc('cli_reserve_credits', {
      p_user_id: userId,
      p_amount: estimatedCost,
      p_audit_id: null,
      p_description: `Remote Audit: ${projectName} (${scopeFiles.length} contracts)`,
    });

    if (reserveError || !reserveResult?.success) {
      return new Response(
        JSON.stringify({ error: reserveResult?.error || 'Failed to reserve credits' }),
        { status: 402, headers: corsHeaders }
      );
    }

    // 6. Create audit record (reuse existing audits table for billing)
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: userId,
        project_name: projectName,
        status: 'analyzing',
        source: 'cli',
        nloc_count: scopeNloc,
        credits_deducted: 0,
        credits_reserved: estimatedCost,
        scope_metadata: scopeFiles.map((f: ScopeFile) => ({
          path: f.path,
          nLOC: f.nLOC,
          complexity: f.complexity,
        })),
        context_metadata: (contextFiles || []).map((f: ContextFile) => ({
          path: f.path,
          nLOC: f.nLOC,
        })),
        contracts_total: scopeFiles.length,
        contracts_completed: 0,
        is_locked: false,
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      console.error('cli-audit-start: Failed to create audit:', auditError);
      // Release credits on failure
      await supabase.rpc('cli_release_credits', {
        p_user_id: userId,
        p_amount: estimatedCost,
        p_audit_id: null,
        p_description: `Release: Audit creation failed for ${projectName}`,
      });
      return new Response(
        JSON.stringify({ error: 'Failed to create audit session' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const sessionId = audit.id;

    // 7. Create audit_orchestration row
    const { error: orchError } = await supabase
      .from('audit_orchestration')
      .insert({
        session_id: sessionId,
        user_id: userId,
        status: 'queued',
        phase: 'queued',
        progress: {},
        request_payload: {
          projectName,
          tier,
          scopeFiles,
          contextFiles: contextFiles || [],
          additionalContext: additionalContext || '',
        },
      });

    if (orchError) {
      console.error('cli-audit-start: Failed to create orchestration row:', orchError);

      // Release reserved credits
      await supabase.rpc('cli_release_credits', {
        p_user_id: userId,
        p_amount: estimatedCost,
        p_audit_id: sessionId,
        p_description: `Release: Orchestration setup failed for ${projectName}`,
      });

      // Delete orphaned audit row
      await supabase.from('audits').delete().eq('id', sessionId);

      return new Response(
        JSON.stringify({ error: 'Failed to initialize audit orchestration' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 8. Call Cloud Run proxy /audit/run (fire-and-forget)
    const proxyUrl = Deno.env.get('CLOUD_RUN_PROXY_URL');
    const sessionSecret = Deno.env.get('SESSION_SECRET');

    if (proxyUrl && sessionSecret) {
      try {
        const proxyResponse = await fetch(`${proxyUrl}/audit/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-service-secret': sessionSecret,
          },
          body: JSON.stringify({
            sessionId,
            userId,
            tier,
            projectName,
            scopeFiles,
            contextFiles: contextFiles || [],
            additionalContext: additionalContext || '',
          }),
        });

        if (!proxyResponse.ok) {
          const errorText = await proxyResponse.text().catch(() => '');
          console.error(`cli-audit-start: Proxy returned ${proxyResponse.status}: ${errorText}`);
        } else {
          console.log(`cli-audit-start: Proxy accepted audit ${sessionId}`);
        }
      } catch (proxyError) {
        console.error('cli-audit-start: Failed to call proxy:', proxyError);
      }
    } else {
      console.warn('cli-audit-start: CLOUD_RUN_PROXY_URL or SESSION_SECRET not set');
    }

    // 9. Return sessionId
    return new Response(
      JSON.stringify({ sessionId }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-start: Unexpected error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
