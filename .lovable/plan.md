
# Fix Google OAuth on Custom Domain

## Problem
Google OAuth fails with "doesn't comply with Google's OAuth 2.0 policy" because the auth-bridge redirect URI (`solarizer-app.lovable.app/~oauth/callback`) conflicts with the custom domain (`solarizer.io`). The managed Lovable OAuth flow sets a state cookie on one domain but the callback arrives on another, causing the "OAuth state parameter missing" error.

## Solution
When users access the app via the custom domain (`solarizer.io`), bypass the Lovable auth-bridge and use Supabase's native OAuth flow with `skipBrowserRedirect: true`. On the default Lovable domain, keep using the managed flow.

## Changes

### File: `src/pages/Auth.tsx`

Update `handleGoogleSignIn` (and `handleAppleSignIn`) to detect custom domains and use a direct OAuth flow:

```typescript
const handleGoogleSignIn = async () => {
  if (!isLogin && !acceptedTerms) {
    triggerTermsWarning();
    return;
  }

  setIsGoogleLoading(true);
  try {
    const isCustomDomain =
      !window.location.hostname.includes("lovable.app") &&
      !window.location.hostname.includes("lovableproject.com");

    if (isCustomDomain) {
      // Bypass auth-bridge for custom domains
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        const oauthUrl = new URL(data.url);
        const allowedHosts = ["accounts.google.com"];
        if (!allowedHosts.some((h) => oauthUrl.hostname === h)) {
          throw new Error("Invalid OAuth redirect URL");
        }
        window.location.href = data.url;
      }
    } else {
      // Standard Lovable managed flow
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    }
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Google sign-in failed',
      description: error?.message || 'An unexpected error occurred.',
    });
  } finally {
    setIsGoogleLoading(false);
  }
};
```

Same pattern for `handleAppleSignIn` (with `"appleid.apple.com"` in allowed hosts).

## Steps You Need to Do (Google Cloud Console)

Since you're on a custom domain, you need your own Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select/create a project
2. Navigate to **APIs & Services > OAuth consent screen** -- configure it, add `solarizer.io` to Authorized domains
3. Go to **APIs & Services > Credentials > Create Credentials > OAuth Client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins**: add `https://solarizer.io` and `https://www.solarizer.io`
   - **Authorized redirect URIs**: add `https://xylfnqrtzqfduutdcxvu.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret**
5. In Lovable, go to **Cloud > Users > Authentication Settings > Sign In Methods > Google** and paste your Client ID and Secret there
6. In **Cloud > Users > Authentication Settings**, set:
   - **Site URL** to `https://solarizer.io`
   - **Redirect URLs**: add `https://solarizer.io/**`

## Files Modified
- `src/pages/Auth.tsx` -- add custom domain detection and direct OAuth flow
