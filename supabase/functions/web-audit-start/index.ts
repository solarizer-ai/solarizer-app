import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

// --- nLOC Algorithm (ported from CLI countNloc.ts) ---

function removeComments(content: string): { cleaned: string; commentCount: number } {
  if (!content) return { cleaned: '', commentCount: 0 };
  let commentLines = 0;
  const result: string[] = [];
  let i = 0;
  let inString = false;
  let stringChar: string | null = null;
  const len = content.length;

  while (i < len) {
    if (!inString && (content[i] === '"' || content[i] === "'")) {
      inString = true;
      stringChar = content[i];
      result.push(content[i]);
      i++;
      continue;
    }
    if (inString) {
      if (content[i] === '\\' && i + 1 < len) {
        result.push(content[i] + content[i + 1]);
        i += 2;
        continue;
      }
      if (content[i] === stringChar) {
        inString = false;
        stringChar = null;
      }
      result.push(content[i]);
      i++;
      continue;
    }
    if (i + 1 < len && content[i] === '/' && content[i + 1] === '*') {
      commentLines++;
      i += 2;
      while (i < len) {
        if (i + 1 < len && content[i] === '*' && content[i + 1] === '/') { i += 2; break; }
        if (content[i] === '\n') commentLines++;
        i++;
      }
      continue;
    }
    if (i + 1 < len && content[i] === '/' && content[i + 1] === '/') {
      commentLines++;
      while (i < len && content[i] !== '\n') i++;
      if (i < len) { result.push('\n'); i++; }
      continue;
    }
    result.push(content[i]);
    i++;
  }
  return { cleaned: result.join(''), commentCount: commentLines };
}

function removeStringLiterals(content: string): string {
  if (!content) return '';
  let res = content.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  res = res.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return res;
}

function countLogicalUnits(content: string): number {
  if (!content || !content.trim()) return 0;
  let processedContent = removeStringLiterals(content);
  let code = 0;
  const patterns = [
    /pragma\s+\w+[^;]*;/g,
    /import\s+(?:\{[^}]*\}|"[^"]*"|'[^']*')\s*(?:from\s+(?:"[^"]*"|'[^']*'))?\s*;/g,
    /import\s+"[^"]*"\s*(?:as\s+\w+)?\s*;/g,
    /using\s+\w+\s+for\s+[^;]+;/g,
    /\b(?:contract|interface|library|abstract\s+contract)\s+\w+/g,
    /\b(?:function\s+\w+|fallback|receive)\s*\([^)]*\)/g,
    /\bconstructor\s*\([^)]*\)/g,
    /\bmodifier\s+\w+\s*(?:\([^)]*\))?/g,
    /\bevent\s+\w+\s*\([^)]*\)/g,
    /\berror\s+\w+\s*(?:\([^)]*\))?/g,
    /\bstruct\s+\w+\s*\{/g,
    /\benum\s+\w+\s*\{/g,
    /\bmapping\s*\([^)]+\)(?:\s+(?:public|private|internal|constant))?\s+\w+\s*;/g,
    /\b(?:uint\d*|int\d*|address|bool|string|bytes\d*)\s+(?:(?:public|private|internal|constant|immutable)\s+)*\w+(?:\s*=\s*[^;]+)?;/g,
    /\btype\s+\w+\s+is\s+[^;]+;/g,
  ];
  for (const pattern of patterns) {
    const matches = processedContent.match(pattern);
    if (matches) { code += matches.length; processedContent = processedContent.replace(pattern, ''); }
  }
  code += processedContent.split(';').length - 1;
  return code;
}

function calculateServerNLOC(content: string): number {
  const { cleaned } = removeComments(content);
  return countLogicalUnits(cleaned);
}

// --- Edge Function Handler ---

interface WebAuditRequest {
  projectName: string;
  files: Array<{ name: string; content: string }>;
  scope: string[];
  additionalContext?: string;
}

function createServiceClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('web-audit-start: Request received');

  let creditsDeducted = false;
  let deductedAmount = 0;
  let deductedUserId: string | null = null;
  let createdSessionId: string | null = null;
  const supabase = createServiceClient();

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    console.log(`web-audit-start: Authenticated user ${userId}`);

    // 2. Parse and validate request body
    let body: WebAuditRequest & { idempotency_key?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: corsHeaders });
    }

    const { projectName, files, scope, additionalContext, idempotency_key } = body;

    if (!projectName || typeof projectName !== 'string' || projectName.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'projectName must be at least 2 characters' }), { status: 400, headers: corsHeaders });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: 'files must be a non-empty array' }), { status: 400, headers: corsHeaders });
    }
    if (!Array.isArray(scope) || scope.length === 0) {
      return new Response(JSON.stringify({ error: 'scope must be a non-empty array of file names' }), { status: 400, headers: corsHeaders });
    }

    const MAX_FILES = 500;
    const MAX_FILE_SIZE = 1024 * 1024;

    if (files.length > MAX_FILES) {
      return new Response(JSON.stringify({ error: `Maximum ${MAX_FILES} files allowed` }), { status: 400, headers: corsHeaders });
    }

    for (const file of files) {
      if (!file.name || typeof file.content !== 'string') {
        return new Response(JSON.stringify({ error: `Invalid file entry: ${file.name || '(unnamed)'}` }), { status: 400, headers: corsHeaders });
      }
      if (new TextEncoder().encode(file.content).length > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: `File "${file.name}" exceeds 1MB limit` }), { status: 400, headers: corsHeaders });
      }
    }

    // 3. Separate scope vs context files
    const scopeFiles = files.filter(f => scope.includes(f.name));
    const contextFiles = files.filter(f => !scope.includes(f.name) && f.name.endsWith('.sol'));

    if (scopeFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid scope files found matching provided scope names' }), { status: 400, headers: corsHeaders });
    }

    // 4. Calculate server-side nLOC
    const scopeFileStats = scopeFiles.map(f => ({
      path: f.name, nLOC: calculateServerNLOC(f.content), content: f.content,
      complexity: 'L2' as 'L1' | 'L2' | 'L3',
    }));
    const contextFileStats = contextFiles.map(f => ({
      path: f.name, nLOC: calculateServerNLOC(f.content), content: f.content,
    }));

    // 5. Call Cloud Run proxy /estimate per scope file for complexity
    const proxyUrl = Deno.env.get('CLOUD_RUN_PROXY_URL');
    if (proxyUrl) {
      const complexityPromises = scopeFileStats.map(async (file) => {
        try {
          const resp = await fetch(`${proxyUrl}/estimate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: file.path, fileContent: file.content }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.success && data.content) {
              try {
                const parsed = JSON.parse(data.content);
                if (parsed.complexity && ['L1', 'L2', 'L3'].includes(parsed.complexity)) {
                  file.complexity = parsed.complexity;
                }
              } catch { /* Keep default L2 */ }
            }
          }
        } catch (err) {
          console.warn(`web-audit-start: Complexity estimation failed for ${file.path}:`, err);
        }
      });
      await Promise.all(complexityPromises);
    }

    // 6. Calculate credits
    const COMPLEXITY_RATES: Record<string, number> = { L1: 0.8, L2: 1.0, L3: 1.2 };
    const scopeNloc = scopeFileStats.reduce((sum, f) => sum + f.nLOC, 0);
    const scopeCost = scopeFileStats.reduce((sum, f) => sum + f.nLOC * (COMPLEXITY_RATES[f.complexity] ?? 1.0), 0);
    const contextNloc = contextFileStats.reduce((sum, f) => sum + f.nLOC, 0);
    const estimatedCost = Math.ceil(scopeCost + contextNloc * 0.15);

    console.log(`web-audit-start: Scope ${scopeNloc} nLOC, context ${contextNloc} nLOC, cost ${estimatedCost} credits`);

    // 7. Check for running audits
    const { data: existingAudits } = await supabase
      .from('audit_orchestration').select('session_id, status').eq('user_id', userId).in('status', ['queued', 'running']);

    if (existingAudits && existingAudits.length > 0) {
      console.warn(`web-audit-start: Conflict – user ${userId} already has active session ${existingAudits[0].session_id} (status: ${existingAudits[0].status})`);
      return new Response(JSON.stringify({ error: 'An audit is already running', sessionId: existingAudits[0].session_id }), { status: 409, headers: corsHeaders });
    }

    // 8. Get user tier and check credits
    const { data: subscription } = await supabase
      .from('subscriptions').select('plan, status, current_period_end').eq('user_id', userId).eq('status', 'active').maybeSingle();

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

    // Plan nLOC limit check
    const PLAN_NLOC_LIMITS: Record<string, number> = { starter: 500, pro: 3000, business: 9999, trial: 9999 };
    const totalNloc = scopeNloc + contextNloc;
    const planNlocLimit = PLAN_NLOC_LIMITS[tier] ?? 500;
    if (totalNloc > planNlocLimit) {
      return new Response(
        JSON.stringify({ error: `Total nLOC (${totalNloc}) exceeds ${tier} plan limit of ${planNlocLimit} nLOC` }),
        { status: 402, headers: corsHeaders }
      );
    }

    // Idempotency check
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('audits')
        .select('id, status')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ sessionId: existing.id, duplicate: true }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    const { data: credits } = await supabase
      .from('nloc_credits').select('credits_remaining').eq('user_id', userId).maybeSingle();
    const creditsRemaining = credits?.credits_remaining || 0;

    if (creditsRemaining < estimatedCost) {
      return new Response(JSON.stringify({ error: 'Insufficient credits', credits_remaining: creditsRemaining, credits_required: estimatedCost }), { status: 402, headers: corsHeaders });
    }

    // 9. Deduct credits
    const { data: deductResult, error: deductError } = await supabase.rpc('cli_deduct_credits', {
      p_user_id: userId, p_amount: estimatedCost, p_audit_id: null,
      p_description: `Web audit: ${projectName} (${scopeFileStats.length} contracts)`,
    });

    if (deductError || !deductResult?.success) {
      return new Response(JSON.stringify({ error: deductResult?.error || 'Failed to deduct credits' }), { status: 402, headers: corsHeaders });
    }

    creditsDeducted = true;
    deductedAmount = estimatedCost;
    deductedUserId = userId;

    // 10. Create audit record
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: userId, project_name: projectName, status: 'analyzing', source: 'web',
        nloc_count: scopeNloc, credits_deducted: estimatedCost,
        idempotency_key: idempotency_key || null,
        scope_metadata: scopeFileStats.map(f => ({ path: f.path, nLOC: f.nLOC, complexity: f.complexity })),
        context_metadata: contextFileStats.map(f => ({ path: f.path, nLOC: f.nLOC })),
        contracts_total: scopeFileStats.length, contracts_completed: 0, is_locked: false,
      })
      .select('id').single();

    if (auditError || !audit) {
      console.error('web-audit-start: Failed to create audit:', auditError);
      await supabase.rpc('cli_refund_credits', { p_user_id: userId, p_amount: estimatedCost, p_audit_id: null, p_description: `Refund: Audit creation failed for ${projectName}` });
      creditsDeducted = false;
      return new Response(JSON.stringify({ error: 'Failed to create audit session' }), { status: 500, headers: corsHeaders });
    }

    const sessionId = audit.id;
    createdSessionId = sessionId;

    // 11. Create audit_orchestration row
    const { error: orchError } = await supabase.from('audit_orchestration').insert({
      session_id: sessionId, user_id: userId, status: 'queued', phase: 'queued', progress: {},
      request_payload: {
        projectName, tier,
        scopeFiles: scopeFileStats.map(({ path, nLOC, complexity }) => ({ path, nLOC, complexity })),
        contextFiles: contextFileStats.map(({ path, nLOC }) => ({ path, nLOC })),
        additionalContext: additionalContext ? `[${additionalContext.length} chars]` : '',
      },
    });

    if (orchError) {
      console.error('web-audit-start: Failed to create orchestration row:', orchError);
      await supabase.rpc('cli_refund_credits', { p_user_id: userId, p_amount: estimatedCost, p_audit_id: sessionId, p_description: `Refund: Orchestration setup failed for ${projectName}` });
      creditsDeducted = false;
      await supabase.from('audits').delete().eq('id', sessionId);
      createdSessionId = null;
      return new Response(JSON.stringify({ error: 'Failed to initialize audit orchestration' }), { status: 500, headers: corsHeaders });
    }

    // 12. Call Cloud Run proxy /audit/run
    const sessionSecret = Deno.env.get('SESSION_SECRET');
    if (!proxyUrl || !sessionSecret) {
      throw new Error('CLOUD_RUN_PROXY_URL or SESSION_SECRET not configured');
    }

    const proxyResponse = await fetch(`${proxyUrl}/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-service-secret': sessionSecret },
      body: JSON.stringify({
        sessionId, userId, tier, projectName,
        scopeFiles: scopeFileStats.map(f => ({ path: f.path, nLOC: f.nLOC, complexity: f.complexity, content: f.content })),
        contextFiles: contextFileStats.map(f => ({ path: f.path, nLOC: f.nLOC, content: f.content })),
        additionalContext: additionalContext || '',
      }),
    });

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text().catch(() => '');
      throw new Error(`Proxy rejected audit (${proxyResponse.status}): ${errorText}`);
    }

    return new Response(JSON.stringify({ sessionId }), { status: 200, headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('web-audit-start: Unexpected error:', errorMessage);

    if (creditsDeducted && deductedUserId) {
      try {
        await supabase.rpc('cli_refund_credits', { p_user_id: deductedUserId, p_amount: deductedAmount, p_audit_id: createdSessionId, p_description: 'Refund: Unexpected error in web audit start' });
      } catch (cleanupErr) { console.error('web-audit-start: Failed to refund credits:', cleanupErr); }
    }
    if (createdSessionId) {
      try {
        await supabase.from('audit_orchestration').delete().eq('session_id', createdSessionId);
        await supabase.from('audits').delete().eq('id', createdSessionId);
      } catch (cleanupErr) { console.error('web-audit-start: Failed to delete orphan audit/orchestration:', cleanupErr); }
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
