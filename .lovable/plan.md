

# Admin Token Type Support

## Changes

### 1. Database Migration
Add `p_token_type` parameter to `admin_create_access_token` RPC with validation.

### 2. `src/pages/dashboard/admin/AdminAccessTokensPage.tsx`
- Add `token_type: string` to `AccessToken` interface
- Add `tokenType` state with a segmented toggle (Subscription / Trial) in the create form
- Pass `p_token_type` in the `createMutation` RPC call, reset on success
- Add "Type" column in the table with a styled badge (muted for subscription, primary for trial)

Two files touched, one migration.

