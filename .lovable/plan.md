

# Edge Function Dual Auth and Config Cleanup

## Changes

### 1. `supabase/functions/save-finding/index.ts`
- Add `import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';`
- Wrap the existing `verifyCallback` block so `verifyServiceSecret` is checked first; only fall back to `verifyCallback` if the service secret check fails

### 2. `supabase/functions/update-findings-batch/index.ts`
- Add `import { verifyServiceSecret } from '../_shared/verifyServiceSecret.ts';`
- Same dual-auth wrapper around the existing `verifyCallback` block

### 3. `supabase/config.toml`
Remove three stale entries:
- `[functions.generate-report]` (no matching function directory)
- Duplicate `[functions.razorpay-create-order]` (keep the one with `verify_jwt = false`)
- `[functions.cli-commit-contract]` (function was deleted)

### 4. Deploy
Redeploy `save-finding` and `update-findings-batch`.

No other files are modified. The `verifyServiceSecret` helper and `fail-audit` (which already has dual auth) remain unchanged.

