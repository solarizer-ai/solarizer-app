

# Fix: Post-OAuth Redirect to Dashboard

## Problem
After signing up/in with Google OAuth via the Lovable managed flow, users are redirected to the home page (`/`) instead of the dashboard. They have to manually navigate to sign in again, which is confusing.

**Root cause**: The Lovable OAuth flow uses `redirect_uri: window.location.origin` (i.e., `https://solarizer.io/`), which lands on the Home page. The Auth page has redirect logic for logged-in users, but only when they're ON the Auth page -- not when they land on Home.

The custom domain flow already does this correctly with `redirectTo: .../dashboard`.

## Solution
Add a simple redirect in the Home page: if the user is authenticated, navigate them to `/dashboard` automatically.

### File: `src/pages/Home.tsx`

Add at the top of the component:

```typescript
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Inside the component:
const { user, loading } = useAuth();
const navigate = useNavigate();

useEffect(() => {
  if (!loading && user) {
    navigate('/dashboard', { replace: true });
  }
}, [user, loading, navigate]);
```

This ensures that:
- After OAuth callback lands on `/`, the auth state listener picks up the session, `user` becomes non-null, and the redirect fires automatically
- Direct visits to `/` by logged-in users also go straight to the dashboard
- The `loading` guard prevents a flash redirect before auth state is resolved

## Files Modified
- `src/pages/Home.tsx` -- add authenticated user redirect to dashboard

