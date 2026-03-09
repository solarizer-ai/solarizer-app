

# RND Staging Mode Toggle

## What We're Building
An admin-only toggle that routes web audits to a staging backend (`STAGING_CLOUD_RUN_PROXY_URL`) instead of production. Non-admin users are completely unaffected.

## Files to Create

### 1. `supabase/functions/web-audit-start-rnd/index.ts`
Exact copy of `web-audit-start/index.ts` with both `CLOUD_RUN_PROXY_URL` references changed to `STAGING_CLOUD_RUN_PROXY_URL` (lines 203 and 373 equivalent).

### 2. `src/hooks/useStagingMode.ts`
Hook that reads/writes `localStorage` key `solarizer_staging_mode`. Only returns `true` for admin users. Exposes `isStagingMode` and `toggleStagingMode`.

### 3. `src/components/StagingModeBanner.tsx`
Compact banner with a Switch toggle and "Staging Mode" label. Shows warning text when active. Only renders for admins.

## Files to Modify

### 4. `src/hooks/useRunAudit.ts`
- Import `useStagingMode`
- Pick edge function name: `isStagingMode ? 'web-audit-start-rnd' : 'web-audit-start'`

### 5. `src/pages/dashboard/NewAuditPage.tsx`
- Import `StagingModeBanner` and `useStagingMode`
- Render `<StagingModeBanner />` above the `<AuditWizard>` component
- Pass `isStagingMode` to conditionally show "(Staging)" indicator

## Secret Required
After deployment, add `STAGING_CLOUD_RUN_PROXY_URL` secret with value `https://solarizer-ai-proxy-rnd-951097474743.us-central1.run.app`.

## What's NOT Changed
- `web-audit-start/index.ts` — untouched
- No database changes needed
- No config.toml changes needed (web-audit-start already doesn't have a config entry, JWT verification uses the default)

