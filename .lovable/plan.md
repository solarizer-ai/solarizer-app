

# Fix: Auto-Refresh Token on 401 Errors

## Problem Summary
The `cloc-estimate` edge function fails with "Session not found" errors even when a user appears to be logged in. This happens because:

1. The inactivity logout logic or another tab may have invalidated the session
2. The frontend's cached token is stale but not yet cleared
3. Supabase's `autoRefreshToken` only handles JWT expiry, not server-side session invalidation

## Solution
Add a **session refresh interceptor** that detects 401 errors from edge functions and attempts to refresh the session before retrying. If refresh fails, redirect to login.

---

## Implementation Plan

### Step 1: Create Session Refresh Utility

**New file: `src/lib/sessionRefresh.ts`**

Create a utility that wraps edge function calls with automatic retry on auth failure:

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function invokeWithRefresh<T>(
  functionName: string, 
  options: { body?: unknown }
): Promise<{ data: T | null; error: Error | null }> {
  // First attempt
  let response = await supabase.functions.invoke<T>(functionName, options);
  
  // If auth error, try refreshing session
  if (response.error?.message?.includes('401') || 
      response.error?.message?.includes('Unauthorized') ||
      response.error?.message?.includes('Invalid or expired')) {
    
    // Attempt to refresh the session
    const { error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      // Session truly expired - sign out
      await supabase.auth.signOut();
      window.location.href = '/auth';
      return { data: null, error: new Error('Session expired. Please sign in again.') };
    }
    
    // Retry with fresh token
    response = await supabase.functions.invoke<T>(functionName, options);
  }
  
  return response;
}
```

### Step 2: Update useClocEstimate Hook

**File: `src/hooks/useClocEstimate.ts`**

Use the new utility for automatic retry:

```typescript
import { invokeWithRefresh } from "@/lib/sessionRefresh";

export function useClocEstimate() {
  return useMutation({
    mutationFn: async (files: FileInput[]): Promise<ClocResult> => {
      const { data, error } = await invokeWithRefresh<ClocResult>(
        'cloc-estimate',
        { body: { files } }
      );

      if (error) {
        throw error;
      }

      return data as ClocResult;
    },
  });
}
```

### Step 3: Update Other Edge Function Calls

Apply the same pattern to other hooks that call edge functions:

| Hook/File | Function |
|-----------|----------|
| `src/hooks/useRunAudit.ts` | `run-audit` |
| `src/hooks/useGitHubConnection.ts` | `github-connect` |
| `src/hooks/useCashfreeCheckout.ts` | `cashfree-create-order` |
| `src/hooks/useCashfreeSubscription.ts` | `cashfree-create-subscription`, `cashfree-upgrade-subscription`, `cashfree-cancel-subscription` |
| `src/lib/githubService.ts` | `github-fetch-repo` |
| `src/components/settings/GitHubIntegration.tsx` | `github-config` |
| `src/pages/PaymentSuccess.tsx` | `cashfree-verify-payment` |

### Step 4: Add Proactive Session Check

**File: `src/hooks/useAuth.tsx`**

Add a method to proactively check/refresh session before critical operations:

```typescript
const ensureValidSession = useCallback(async (): Promise<boolean> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (!session || error) {
    // Try to refresh
    const { error: refreshError } = await supabase.auth.refreshSession();
    return !refreshError;
  }
  
  return true;
}, []);
```

---

## Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `src/lib/sessionRefresh.ts` | Create | New utility for wrapped edge function calls |
| `src/hooks/useClocEstimate.ts` | Modify | Use invokeWithRefresh |
| `src/hooks/useRunAudit.ts` | Modify | Use invokeWithRefresh |
| `src/hooks/useGitHubConnection.ts` | Modify | Use invokeWithRefresh |
| `src/lib/githubService.ts` | Modify | Use invokeWithRefresh |
| `src/hooks/useCashfreeCheckout.ts` | Modify | Use invokeWithRefresh |
| `src/hooks/useCashfreeSubscription.ts` | Modify | Use invokeWithRefresh |
| `src/components/settings/GitHubIntegration.tsx` | Modify | Use invokeWithRefresh |
| `src/pages/PaymentSuccess.tsx` | Modify | Use invokeWithRefresh |

---

## Expected Behavior After Fix

1. User's session expires silently (inactivity or server invalidation)
2. User attempts to run CLOC estimation
3. Edge function returns 401
4. `invokeWithRefresh` detects the error and calls `refreshSession()`
5. If refresh succeeds → retry the original request
6. If refresh fails → redirect to login page with clear message

This ensures users never see cryptic "Invalid or expired token" errors - they either get their request processed or are cleanly redirected to login.

