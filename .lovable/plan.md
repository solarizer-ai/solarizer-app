

# Fix: Public Audits Leaking into Other Users' Dashboards

## Problem
When an audit has `is_public = true`, the RLS policy "Anyone can view public audits by slug" grants SELECT access to ANY authenticated user -- even in bulk listing queries. This means every user sees other users' public audits in their dashboard.

## Changes

### 1. Frontend: Scope `useAudits` to owned + shared audits only

**File: `src/hooks/useAudits.ts`**

Replace the single `select('*')` query with two scoped queries:

```typescript
// 1. Own audits
const { data: ownAudits, error: e1 } = await supabase
  .from('audits')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
if (e1) throw e1;

// 2. Shared audit IDs (accepted shares only)
const { data: shares } = await supabase
  .from('audit_shares')
  .select('audit_id')
  .eq('shared_with_user_id', user.id)
  .eq('status', 'accepted');

let sharedAudits: typeof ownAudits = [];
const sharedIds = (shares || []).map(s => s.audit_id);
if (sharedIds.length > 0) {
  const { data, error: e2 } = await supabase
    .from('audits')
    .select('*')
    .in('id', sharedIds)
    .order('created_at', { ascending: false });
  if (e2) throw e2;
  sharedAudits = data || [];
}

const audits = [...(ownAudits || []), ...sharedAudits];
```

### 2. Database: Tighten the public audit RLS policy

**Migration:** Drop the current broad policy and replace it with one that requires the query to filter by `public_slug` (i.e., the slug must appear in the query filter). Since Postgres RLS cannot inspect query WHERE clauses directly, we restrict the anonymous/public SELECT to only work via an RPC function.

Simpler approach -- keep the policy but make it restrictive by requiring the caller to be anonymous (unauthenticated), so authenticated users' bulk queries never match:

```sql
-- Drop the overly broad policy
DROP POLICY "Anyone can view public audits by slug" ON public.audits;

-- Re-create: only allow anon role (unauthenticated) to view public audits
-- This prevents authenticated users from seeing public audits in their dashboard listing
CREATE POLICY "Anon can view public audits by slug"
  ON public.audits
  FOR SELECT
  TO anon
  USING (is_public = true AND public_slug IS NOT NULL);

-- Also allow authenticated users to view a specific public audit 
-- only when they query by public_slug explicitly
CREATE POLICY "Authenticated users can view public audits by slug"
  ON public.audits
  FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    AND public_slug IS NOT NULL 
    AND public_slug = current_setting('request.query.public_slug', true)
  );
```

However, `current_setting('request.query...')` is not reliably available in all Supabase contexts. A more robust approach:

```sql
DROP POLICY "Anyone can view public audits by slug" ON public.audits;

-- Only the anon role can bulk-read public audits (for the /report/:slug page which uses anon)
CREATE POLICY "Anon can view public audits by slug"
  ON public.audits
  FOR SELECT
  TO anon
  USING (is_public = true AND public_slug IS NOT NULL);
```

This works because:
- The `/report/:slug` public page uses unauthenticated (anon) access -- it will still work.
- Authenticated users' dashboard queries no longer match any public audit policy, so they only see their own + shared audits.
- The `usePublicAudit` hook (used on the public report page) queries without auth, so it uses the `anon` role.

**Important check:** Verify that `usePublicAudit` in `src/hooks/usePublicAudit.ts` does NOT rely on an authenticated session. Currently it has no `useAuth()` dependency and no `enabled: !!user` guard, so it works with anon access -- this is correct.

### 3. Also tighten findings RLS for public audits

The findings table has a similar broad policy: "Anyone can view findings for public audits". Apply the same fix:

```sql
DROP POLICY "Anyone can view findings for public audits" ON public.findings;

CREATE POLICY "Anon can view findings for public audits"
  ON public.findings
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM audits a
      WHERE a.id = findings.audit_id
        AND a.is_public = true
    )
  );
```

## Files Modified
- `src/hooks/useAudits.ts` -- scope listing to owned + shared audits
- Database migration -- restrict public audit/findings policies to `anon` role only

## Technical Details

| Layer | Change | Why |
|-------|--------|-----|
| Frontend (`useAudits`) | Filter by `user_id` + shared IDs | Prevents public audits appearing in dashboard |
| RLS (audits) | Restrict public policy to `anon` role | Defense-in-depth: even if frontend is bypassed, authenticated queries can't see others' public audits |
| RLS (findings) | Restrict public policy to `anon` role | Same protection for findings data |

