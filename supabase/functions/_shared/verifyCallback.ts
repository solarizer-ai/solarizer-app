import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface VerifyResult {
  valid: boolean;
  error?: string;
  status?: number;
}

/**
 * Verifies per-audit callback token using constant-time comparison.
 * Falls back to global CALLBACK_SECRET for backward compatibility with
 * audits created before per-audit tokens were introduced.
 */
export async function verifyCallback(
  req: Request,
  auditId: string,
  supabase: SupabaseClient
): Promise<VerifyResult> {
  // Check for per-audit token first
  const callbackToken = req.headers.get('x-callback-token');
  // Fall back to legacy global secret
  const callbackSecret = req.headers.get('x-callback-secret');

  if (!callbackToken && !callbackSecret) {
    return { valid: false, error: 'Missing authentication header', status: 401 };
  }

  // If per-audit token is provided, verify it against DB
  if (callbackToken) {
    const { data: audit, error: fetchError } = await supabase
      .from('audits')
      .select('callback_token')
      .eq('id', auditId)
      .single();

    if (fetchError || !audit) {
      return { valid: false, error: 'Audit not found', status: 404 };
    }

    if (!audit.callback_token) {
      // Audit was created before per-audit tokens — reject per-audit header
      return { valid: false, error: 'Unauthorized', status: 401 };
    }

    // Constant-time comparison
    const encoder = new TextEncoder();
    const a = encoder.encode(callbackToken);
    const b = encoder.encode(audit.callback_token);

    if (a.byteLength !== b.byteLength) {
      return { valid: false, error: 'Unauthorized', status: 401 };
    }

    const isEqual = crypto.subtle.timingSafeEqual(a, b);
    if (!isEqual) {
      return { valid: false, error: 'Unauthorized', status: 401 };
    }

    return { valid: true };
  }

  // Legacy: verify global CALLBACK_SECRET
  const expectedSecret = Deno.env.get('CALLBACK_SECRET');
  if (!expectedSecret) {
    console.error('verifyCallback: CALLBACK_SECRET not configured');
    return { valid: false, error: 'Service temporarily unavailable', status: 503 };
  }

  // Constant-time comparison to prevent timing attacks
  const enc = new TextEncoder();
  const bufA = enc.encode(callbackSecret);
  const bufB = enc.encode(expectedSecret);

  if (bufA.byteLength !== bufB.byteLength) {
    // Dummy comparison to maintain constant time on length mismatch
    crypto.subtle.timingSafeEqual(bufA, bufA);
    return { valid: false, error: 'Unauthorized', status: 401 };
  }

  if (!crypto.subtle.timingSafeEqual(bufA, bufB)) {
    return { valid: false, error: 'Unauthorized', status: 401 };
  }

  return { valid: true };
}
