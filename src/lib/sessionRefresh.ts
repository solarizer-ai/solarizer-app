import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper for Supabase edge function calls that automatically handles
 * session refresh on 401 errors and retries the request.
 * 
 * If session refresh fails, redirects to auth page.
 */
export async function invokeWithRefresh<T>(
  functionName: string,
  options: { body?: unknown } = {}
): Promise<{ data: T | null; error: Error | null }> {
  // First attempt
  let response = await supabase.functions.invoke<T>(functionName, options);

  // Check for auth errors (401/Unauthorized/Invalid token)
  const errorMessage = response.error?.message?.toLowerCase() || '';
  const isAuthError =
    errorMessage.includes('401') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid or expired') ||
    errorMessage.includes('session not found');

  if (isAuthError) {
    console.log(`[sessionRefresh] Auth error detected for ${functionName}, attempting refresh...`);

    // Attempt to refresh the session
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.warn('[sessionRefresh] Session refresh failed, signing out:', refreshError.message);
      // Session truly expired - sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/auth';
      return { data: null, error: new Error('Session expired. Please sign in again.') };
    }

    console.log(`[sessionRefresh] Session refreshed, retrying ${functionName}...`);
    // Retry with fresh token
    response = await supabase.functions.invoke<T>(functionName, options);
  }

  return {
    data: response.data ?? null,
    error: response.error ? new Error(response.error.message) : null,
  };
}
