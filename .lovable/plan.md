

# Fix: GitHub Import "Edge Function returned a non-2xx status code"

## Root Cause

The `github-fetch-repo` edge function has **outdated CORS headers**. It's missing the `x-supabase-client-*` headers that the newer Supabase JS client sends with every request. This causes the browser's CORS preflight (OPTIONS) to fail, which surfaces as a generic "Edge Function returned a non-2xx status code" error — before the function code even runs (explaining the empty logs).

## Fix

### 1. Update CORS headers in `supabase/functions/github-fetch-repo/index.ts`

Replace the current headers:
```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
```
With the full set:
```
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
```

### 2. Fix duplicate config entry in `supabase/config.toml`

Remove the duplicate `[functions.razorpay-create-order]` on line 16 (keeping lines 17-18). This could cause parsing issues.

| File | Change |
|------|--------|
| `supabase/functions/github-fetch-repo/index.ts` | Update CORS `Access-Control-Allow-Headers` |
| `supabase/config.toml` | Remove duplicate `[functions.razorpay-create-order]` entry |

