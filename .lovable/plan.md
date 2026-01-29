
# Updated Fix: Logout, Failed/Cancelled Audit Display

## Problem Summary

Three issues need to be addressed:

1. **Logout not working**: User clicks logout but remains logged in after page refresh
2. **Share/Export buttons visible on failed/cancelled audits**: These should be disabled
3. **Cancelled audits show full report**: Should show a warning message similar to failed audits

---

## Root Cause Analysis

### Issue 1: Logout Still Not Working

Looking at the current code, the issue is that navigation to `/login` happens immediately after calling `signOut()`, but:
1. The sign out may not complete before navigation occurs
2. After navigation, the page may reinitialize auth state before the sign-out is fully processed
3. The navigate goes to `/login` but should go to home page `/` as per user request

**Current code in Settings.tsx (lines 284-289):**
```typescript
<Button 
  onClick={async () => {
    await signOut();
    navigate('/login');  // Should be '/' and needs state cleanup
  }}
```

**Solution**:
- Navigate to home page `/` instead of `/login`
- Clear local user state immediately before sign out
- Add a small delay to ensure sign-out completes

### Issue 2: Share/Export Buttons on Failed/Cancelled Audits

Currently, the share and export buttons in Report.tsx (lines 231-264) only check:
- `isOwner && canShareReports` for Share button
- `currentAudit?.status !== 'analyzing' && status !== 'pending'` for Export button

Neither checks for `failed` or `cancelled` status.

**Solution**: Add status check to hide/disable these buttons when audit is failed or cancelled.

### Issue 3: Cancelled Audits Show Full Report

Currently, Report.tsx only handles `failed` status (line 284). Cancelled audits fall through and show the full report with score card and tabs.

**Solution**: Extend the conditional to also handle `cancelled` status with a different message.

---

## Implementation Plan

### 1. Fix Logout - Navigate to Home Page

**File: `src/pages/Settings.tsx` (lines 284-294)**

```typescript
<Button 
  variant="outline" 
  onClick={async () => {
    await signOut();
    // Navigate to home page after logout
    navigate('/');
  }}
  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
>
  <LogOut className="w-4 h-4" />
  Logout
</Button>
```

**File: `src/hooks/useAuth.tsx` (lines 22-27)**

Update signOut to clear user state and use window.location for hard navigation:

```typescript
const signOut = useCallback(async () => {
  // Clear local state immediately
  setUser(null);
  setSession(null);
  
  // Clear custom session tracking
  localStorage.removeItem('solarizer_last_activity');
  localStorage.removeItem('solarizer_remember_me');
  
  // Sign out with global scope to invalidate on server too
  await supabase.auth.signOut({ scope: 'global' });
  
  // Force hard navigation to clear all state
  window.location.href = '/';
}, []);
```

### 2. Disable Share/Export for Failed/Cancelled Audits

**File: `src/pages/Report.tsx`**

Add helper variable and update button visibility:

```typescript
// Add after line 183
const isFailedOrCancelled = currentAudit?.status === 'failed' || currentAudit?.status === 'cancelled';

// Update Share button (around line 231-240)
{isOwner && canShareReports && !isFailedOrCancelled && (
  <Button ... />
)}

// Update Export button (around line 242-264)
{currentAudit?.status !== 'analyzing' && currentAudit?.status !== 'pending' && !isFailedOrCancelled && (
  <TooltipProvider>...</TooltipProvider>
)}
```

### 3. Handle Cancelled Audits with Warning Message

**File: `src/pages/Report.tsx` (lines 284-304)**

Extend the failed audit check to include cancelled:

```tsx
{(currentAudit.status === 'failed' || currentAudit.status === 'cancelled') ? (
  /* Failed/Cancelled audit: Show only warning message */
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
      <XCircle className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium text-foreground mb-2">
      {currentAudit.status === 'cancelled' ? 'Analysis Cancelled' : 'Analysis Failed'}
    </h3>
    <p className="text-sm text-muted-foreground max-w-md mb-4">
      {currentAudit.status === 'cancelled' 
        ? 'This analysis was cancelled by you. Your credits have been automatically refunded.'
        : 'This analysis encountered an error and could not be completed. Your credits have been automatically refunded.'
      }
    </p>
    <p className="text-xs text-muted-foreground mb-6">
      {currentAudit.status === 'cancelled'
        ? 'You can start a new analysis whenever you\'re ready.'
        : 'Please try again after some time. If the issue persists, contact support.'
      }
    </p>
    <Button 
      onClick={() => navigate("/dashboard?new=true")} 
      className="gap-2"
    >
      Start New Analysis
    </Button>
  </div>
) : (
  /* Normal audit: Show all content */
  <>
    <SecurityScoreCard ... />
    ...
  </>
)}
```

Also update the toast notification to handle cancelled status:

```typescript
// Update useEffect (lines 164-173)
useEffect(() => {
  if ((currentAudit?.status === 'failed' || currentAudit?.status === 'cancelled') && !hasShownFailedToast) {
    const isCancelled = currentAudit.status === 'cancelled';
    toast.error(isCancelled ? "Analysis Cancelled" : "Analysis Failed", {
      description: isCancelled 
        ? "This analysis was cancelled. Your credits have been automatically refunded."
        : "This analysis encountered an error. Your credits have been automatically refunded.",
      duration: 8000,
    });
    setHasShownFailedToast(true);
  }
}, [currentAudit?.status, currentAudit?.id, hasShownFailedToast]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Clear state and use hard navigation in signOut |
| `src/pages/Settings.tsx` | Navigate to `/` instead of `/login` |
| `src/pages/Report.tsx` | Hide share/export for failed/cancelled, show warning for cancelled |

---

## Expected Behavior After Fix

1. **Logout**: Click logout → user state cleared → navigates to home page → refresh keeps user logged out
2. **Failed Audit Report**: Shows grey warning with "Analysis Failed" message, no share/export buttons
3. **Cancelled Audit Report**: Shows grey warning with "Analysis Cancelled" + "cancelled by you" message, no share/export buttons
4. **Audit Cards**: Both Failed and Cancelled show grey pills (already implemented)
