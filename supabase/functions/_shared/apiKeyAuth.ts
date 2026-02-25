import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

export interface ApiKeyValidationResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

export async function validateApiKey(
  apiKey: string,
  supabase: SupabaseClient
): Promise<ApiKeyValidationResult> {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'Missing API key' };
  }

  if (!apiKey.startsWith('sol_live_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Use 16-char prefix for narrower DB lookup
  const keyPrefix = apiKey.substring(0, 16);

  const { data: keys, error: queryError } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash')
    .eq('key_prefix', keyPrefix)
    .is('revoked_at', null);

  if (queryError) {
    console.error('apiKeyAuth: Database query error:', queryError);
    return { valid: false, error: 'Authentication service error' };
  }

  // Fallback: if no keys matched with 16-char prefix, retry with legacy 8-char prefix
  let matchKeys = keys;
  if (!matchKeys || matchKeys.length === 0) {
    const legacyPrefix = apiKey.substring(0, 8);
    const { data: legacyKeys, error: legacyError } = await supabase
      .from('api_keys')
      .select('id, user_id, key_hash')
      .eq('key_prefix', legacyPrefix)
      .is('revoked_at', null);

    if (legacyError) {
      console.error('apiKeyAuth: Legacy prefix query error:', legacyError);
      return { valid: false, error: 'Authentication service error' };
    }
    matchKeys = legacyKeys;
  }

  if (!matchKeys || matchKeys.length === 0) {
    return { valid: false, error: 'Invalid API key' };
  }

  for (const key of matchKeys) {
    try {
      const matches = bcrypt.compareSync(apiKey, key.key_hash);
      if (matches) {
        supabase
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', key.id)
          .then(() => {})
          .catch((err: Error) => console.error('apiKeyAuth: Failed to update last_used_at:', err));

        return { valid: true, userId: key.user_id };
      }
    } catch (err) {
      console.error('apiKeyAuth: bcrypt compare error:', err);
      continue;
    }
  }

  return { valid: false, error: 'Invalid API key' };
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
