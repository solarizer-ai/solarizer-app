import { validateApiKey, createServiceClient } from '../_shared/apiKeyAuth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, content-type',
  'Content-Type': 'application/json',
};

// --- Server-side nLOC calculation ---
function removeComments(content: string): { cleaned: string } {
  if (!content) return { cleaned: '' };
  const result: string[] = [];
  let i = 0;
  let inString = false;
  let stringChar: string | null = null;
  const len = content.length;
  while (i < len) {
    if (!inString && (content[i] === '"' || content[i] === "'")) { inString = true; stringChar = content[i]; result.push(content[i]); i++; continue; }
    if (inString) { if (content[i] === '\\' && i + 1 < len) { result.push(content[i] + content[i + 1]); i += 2; continue; } if (content[i] === stringChar) { inString = false; stringChar = null; } result.push(content[i]); i++; continue; }
    if (i + 1 < len && content[i] === '/' && content[i + 1] === '*') { i += 2; while (i < len) { if (i + 1 < len && content[i] === '*' && content[i + 1] === '/') { i += 2; break; } i++; } continue; }
    if (i + 1 < len && content[i] === '/' && content[i + 1] === '/') { while (i < len && content[i] !== '\n') i++; if (i < len) { result.push('\n'); i++; } continue; }
    result.push(content[i]); i++;
  }
  return { cleaned: result.join('') };
}

function removeStringLiterals(content: string): string {
  if (!content) return '';
  return content.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

function countLogicalUnits(content: string): number {
  if (!content || !content.trim()) return 0;
  let processedContent = removeStringLiterals(content);
  let code = 0;
  const patterns = [
    /pragma\s+\w+[^;]*;/g, /import\s+(?:\{[^}]*\}|"[^"]*"|'[^']*')\s*(?:from\s+(?:"[^"]*"|'[^']*'))?\s*;/g,
    /import\s+"[^"]*"\s*(?:as\s+\w+)?\s*;/g, /using\s+\w+\s+for\s+[^;]+;/g,
    /\b(?:contract|interface|library|abstract\s+contract)\s+\w+/g,
    /\b(?:function\s+\w+|fallback|receive)\s*\([^)]*\)/g, /\bconstructor\s*\([^)]*\)/g,
    /\bmodifier\s+\w+\s*(?:\([^)]*\))?/g, /\bevent\s+\w+\s*\([^)]*\)/g, /\berror\s+\w+\s*(?:\([^)]*\))?/g,
    /\bstruct\s+\w+\s*\{/g, /\benum\s+\w+\s*\{/g,
    /\bmapping\s*\([^)]+\)(?:\s+(?:public|private|internal|constant))?\s+\w+\s*;/g,
    /\b(?:uint\d*|int\d*|address|bool|string|bytes\d*)\s+(?:(?:public|private|internal|constant|immutable)\s+)*\w+(?:\s*=\s*[^;]+)?;/g,
    /\btype\s+\w+\s+is\s+[^;]+;/g,
  ];
  for (const pattern of patterns) { const matches = processedContent.match(pattern); if (matches) { code += matches.length; processedContent = processedContent.replace(pattern, ''); } }
  code += processedContent.split(';').length - 1;
  return code;
}

function calculateServerNLOC(content: string): number {
  const { cleaned } = removeComments(content);
  return countLogicalUnits(cleaned);
}

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
  idempotency_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('cli-audit-start: Request received');

  // A3: Tracking variables for outer catch cleanup
  let creditsDeducted = false;
  let deductedAmount = 0;
  let deductedUserId: string | null = null;
  let createdSessionId: string | null = null;
  const supabase = createServiceClient();

  try {
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

    const { projectName, scopeFiles, contextFiles, additionalContext, idempotency_key } = body;

    // Recalculate nLOC server-side
    for (const f of scopeFiles) {
      if (f.content) f.nLOC = calculateServerNLOC(f.content);
    }
    for (const f of contextFiles || []) {
      if (f.content) f.nLOC = calculateServerNLOC(f.content);
    }

    if (!Array.isArray(scopeFiles) || scopeFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'scopeFiles must be a non-empty array' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // B4: Idempotency check
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('audits')
        .select('id, status')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            sessionId: existing.id,
            status: existing.status,
            duplicate: true,
          }),
          { status: 200, headers: corsHeaders },
        );
      }
    }

    // A8: Input bounds validation
    const MAX_SCOPE_FILES = 50;
    const MAX_TOTAL_NLOC = 50000;

    if (scopeFiles.length > MAX_SCOPE_FILES) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_SCOPE_FILES} scope files allowed` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const totalNloc = scopeFiles.reduce((s: number, f: ScopeFile) => s + f.nLOC, 0);
    if (totalNloc > MAX_TOTAL_NLOC) {
      return new Response(
        JSON.stringify({ error: `Total nLOC exceeds maximum of ${MAX_TOTAL_NLOC}` }),
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
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription. Please subscribe to start an audit.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const isExpired =
      subscription.current_period_end !== null &&
      new Date(subscription.current_period_end) < new Date();

    if (isExpired) {
      return new Response(
        JSON.stringify({ error: 'Your subscription has expired. Please renew to continue.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const tier = subscription.plan;

    // Map internal plan names to proxy-recognized tiers
    const TIER_MAP: Record<string, string> = {
      starter: 'starter', pro: 'pro', business: 'business',
      trial: 'business',  // Trial gets Inferno-tier access
    };
    const proxyTier = TIER_MAP[tier] ?? 'starter';

    // Calculate estimated cost with per-contract complexity multipliers
    const COMPLEXITY_RATES: Record<string, number> = { L1: 0.8, L2: 1.0, L3: 1.2 };
    const scopeNloc = scopeFiles.reduce((sum: number, f: ScopeFile) => sum + f.nLOC, 0);
    const scopeCost = scopeFiles.reduce((sum: number, f: ScopeFile) => {
      const rate = COMPLEXITY_RATES[f.complexity] ?? 1.0;
      return sum + f.nLOC * rate;
    }, 0);
    const contextNloc = (contextFiles || []).reduce((sum: number, f: ContextFile) => sum + f.nLOC, 0);
    const estimatedCost = Math.ceil(scopeCost + contextNloc * 0.15);

    // Plan nLOC limit check
    const PLAN_NLOC_LIMITS: Record<string, number> = { starter: 500, pro: 3000, business: 9999, trial: 9999 };
    const totalNlocCheck = scopeNloc + contextNloc;
    const planNlocLimit = PLAN_NLOC_LIMITS[tier] ?? 500;

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

    // 5. Deduct credits upfront
    const { data: deductResult, error: deductError } = await supabase.rpc('cli_deduct_credits', {
      p_user_id: userId,
      p_amount: estimatedCost,
      p_audit_id: null,
      p_description: `Deduct: ${projectName} (${scopeFiles.length} contracts)`,
    });

    if (deductError || !deductResult?.success) {
      return new Response(
        JSON.stringify({ error: deductResult?.error || 'Failed to deduct credits' }),
        { status: 402, headers: corsHeaders }
      );
    }

    // A3: Track deduction for cleanup
    creditsDeducted = true;
    deductedAmount = estimatedCost;
    deductedUserId = userId;

    // 6. Create audit record (reuse existing audits table for billing)
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        idempotency_key: idempotency_key || null,
        user_id: userId,
        project_name: projectName,
        status: 'analyzing',
        source: 'cli',
        nloc_count: scopeNloc,
        credits_deducted: estimatedCost,
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
      // Refund credits on failure
      const { error: refundError } = await supabase.rpc('cli_refund_credits', {
        p_user_id: userId,
        p_amount: estimatedCost,
        p_audit_id: null,
        p_description: `Refund: Audit creation failed for ${projectName}`,
      });
      if (refundError) {
        console.error(
          `cli-audit-start: CRITICAL — refund of ${estimatedCost} credits failed for user ${userId}:`,
          refundError
        );
      }
      creditsDeducted = false;
      return new Response(
        JSON.stringify({ error: 'Failed to create audit session' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const sessionId = audit.id;
    createdSessionId = sessionId;

    // 7. Create audit_orchestration row
    const { error: orchError } = await supabase
      .from('audit_orchestration')
      .insert({
        session_id: sessionId,
        user_id: userId,
        status: 'queued',
        phase: 'queued',
        progress: {},
        // A9: Strip file content from stored payload
        request_payload: {
          projectName,
          tier: proxyTier,
          scopeFiles: scopeFiles.map(
            ({ path, nLOC, complexity }: ScopeFile) => ({ path, nLOC, complexity })
          ),
          contextFiles: (contextFiles || []).map(
            ({ path, nLOC }: ContextFile) => ({ path, nLOC })
          ),
          additionalContext: additionalContext
            ? `[${additionalContext.length} chars]`
            : '',
        },
      });

    if (orchError) {
      console.error('cli-audit-start: Failed to create orchestration row:', orchError);

      // Refund credits on failure
      const { error: orchRefundError } = await supabase.rpc('cli_refund_credits', {
        p_user_id: userId,
        p_amount: estimatedCost,
        p_audit_id: sessionId,
        p_description: `Refund: Orchestration setup failed for ${projectName}`,
      });
      if (orchRefundError) {
        console.error(
          `cli-audit-start: CRITICAL — refund of ${estimatedCost} credits failed for user ${userId} (audit ${sessionId}):`,
          orchRefundError
        );
      }
      creditsDeducted = false;

      // Delete orphaned audit row
      await supabase.from('audits').delete().eq('id', sessionId);
      createdSessionId = null;

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
    // A3: Outer catch cleanup
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('cli-audit-start: Unexpected error:', errorMessage);

    // Clean up any deducted credits
    if (creditsDeducted && deductedUserId) {
      try {
        await supabase.rpc('cli_refund_credits', {
          p_user_id: deductedUserId,
          p_amount: deductedAmount,
          p_audit_id: createdSessionId,
          p_description: 'Refund: Unexpected error in audit start',
        });
      } catch (cleanupErr) {
        console.error('cli-audit-start: Failed to refund credits:', cleanupErr);
      }
    }

    // Clean up orphaned audit row
    if (createdSessionId) {
      try {
        await supabase.from('audits').delete().eq('id', createdSessionId);
      } catch (cleanupErr) {
        console.error('cli-audit-start: Failed to delete orphan audit:', cleanupErr);
      }
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
