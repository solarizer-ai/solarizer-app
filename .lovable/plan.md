

# Fix: Logout Persistence & Failed Audit Display

## Problem Summary

Two issues need to be addressed:

1. **Logout not persisting**: When a user clicks logout and refreshes the page, they remain logged in
2. **Failed audit display**: Failed audits still show score cards, tabs, and findings instead of a simple failure message. Additionally, the "Failed" pill is red/purple instead of grey.

---

## Root Cause Analysis

### Issue 1: Logout Persistence

The current logout implementation in `Settings.tsx` calls `supabase.auth.signOut()` directly (bypassing the `signOut` function from `useAuth`). This uses the default `local` scope which only clears the local session. The problem:

1. `supabase.auth.signOut()` with default scope only clears local storage
2. If the session was "remembered" or if there's a race condition, the `refreshSession` mechanism (from our new `sessionRefresh.ts`) or the `autoRefreshToken` feature might restore the session
3. The Settings page uses a direct call instead of the `signOut` from `useAuth` which clears additional localStorage items

**Solution**: 
- Use `signOut({ scope: 'global' })` to invalidate the session both locally and on the server
- Ensure both logout paths (Settings page and useAuth) use the global scope
- Clear localStorage auth tokens explicitly before signing out

### Issue 2: Failed Audit Display

Currently `Report.tsx` shows the failed banner but continues to render:
- SecurityScoreCard with grade and vulnerability counts
- Tabs for Scope, Coverage, and Findings
- RemediationProgressWidget

For a failed audit, none of this data is valid/available.

**Solution**:
- Wrap the main content (SecurityScoreCard, tabs) in a condition that checks if status is NOT 'failed'
- Show only the failure banner with a message about credit refund
- Change the "Failed" pill in `AuditCard.tsx` from red (`text-critical`) to grey (`text-muted-foreground`)

---

## Implementation Plan

### 1. Fix Logout Persistence

**File: `src/hooks/useAuth.tsx`**

Update the `signOut` function to use global scope and clear all auth-related localStorage:

```typescript
const signOut = useCallback(async () => {
  // Clear custom session tracking
  localStorage.removeItem('solarizer_last_activity');
  localStorage.removeItem('solarizer_remember_me');
  
  // Sign out with global scope to invalidate on server too
  await supabase.auth.signOut({ scope: 'global' });
}, []);
```

**File: `src/pages/Settings.tsx`**

Update the logout button to use the `signOut` from `useAuth` context instead of calling `supabase.auth.signOut()` directly:

```typescript
// Change from:
await supabase.auth.signOut();

// To:
const { signOut } = useAuth();
// ...
await signOut();
```

### 2. Fix Failed Audit Display

**File: `src/pages/Report.tsx`**

Wrap the SecurityScoreCard and Tabs in a condition to hide them for failed audits. Show an expanded failure message instead:

```tsx
{currentAudit.status === 'failed' ? (
  // Failed audit: Show only failure message
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
      <XCircle className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium text-foreground mb-2">Analysis Failed</h3>
    <p className="text-sm text-muted-foreground max-w-md mb-4">
      This analysis encountered an error and could not be completed. 
      Your credits have been automatically refunded.
    </p>
    <p className="text-xs text-muted-foreground">
      Please try again after some time. If the issue persists, contact support.
    </p>
    <Button 
      onClick={() => navigate("/dashboard?new=true")} 
      className="mt-6 gap-2"
    >
      Try Again
    </Button>
  </div>
) : (
  // Normal audit: Show all content
  <>
    <SecurityScoreCard ... />
    {canCommentOnFindings && <RemediationProgressWidget ... />}
    <Tabs ...>...</Tabs>
  </>
)}
```

Also remove the separate failed banner since we're now showing a full-page failure state.

**File: `src/components/AuditCard.tsx`**

Change the "Failed" status style from red/critical to grey:

```typescript
failed: {
  label: "Failed",
  icon: <AlertOctagon className="w-3 h-3" />,
  className: "text-muted-foreground bg-muted border-border",  // Changed from critical
},
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Add `{ scope: 'global' }` to `signOut()` call |
| `src/pages/Settings.tsx` | Use `signOut` from `useAuth` instead of direct `supabase.auth.signOut()` |
| `src/pages/Report.tsx` | Conditionally hide SecurityScoreCard and Tabs for failed audits, show expanded failure message |
| `src/components/AuditCard.tsx` | Change "Failed" pill color from red to grey |

---

## Expected Behavior After Fix

1. **Logout**: When user clicks logout → page refreshes → user remains logged out (redirected to login)
2. **Failed Audit Report**: Shows centered failure message with:
   - Grey XCircle icon
   - "Analysis Failed" heading
   - Credit refund message
   - "Try again after some time" note
   - "Try Again" button
3. **Failed Audit Card**: Shows grey "Failed" pill instead of red/critical colored pill

