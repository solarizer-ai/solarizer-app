

# Security and UX Audit — Implementation Plan

This plan covers all fixes from the audit spec, organized into implementation phases by severity. The total scope spans database migrations, edge function updates, frontend fixes, and dead code cleanup.

---

## Phase 1: CRITICAL Security Fixes

### C1. Replace `reactivateSubscription` with server-side RPC
- Create a new `reactivate_subscription` RPC (SECURITY DEFINER) that verifies `status = 'active'` and `current_period_end > now()` before setting `cancel_at_period_end = false`
- Update `useRazorpaySubscription.ts` to call `supabase.rpc('reactivate_subscription')` instead of direct table update

### C2. Server-side feature gates via RLS policies
- Add RLS policy on `findings` to restrict `severity IN ('low','info','gas')` to users with `pro` or `business` plan (via a SECURITY DEFINER helper function checking subscriptions)
- Add RLS INSERT policy on `audit_shares` restricting share creation to `business` plan users
- Add RLS INSERT/SELECT policy on `finding_comments` restricting to `pro+` plan users
- Note: These augment existing client-side gates with server-side enforcement

### C3. Drop `purchase_subscription` RPC
- Migration: `DROP FUNCTION IF EXISTS purchase_subscription(text, text);`
- Remove the `usePurchaseSubscription` mutation from `useSubscription.ts` (lines ~185-217) and any references

### C4. Remove client-supplied `prorationAmount` in `razorpay-create-order`
- Delete the `else if (orderType === "upgrade" && prorationAmount)` branch (lines 104-106)
- Remove `"upgrade"` from the `orderType` union in the edge function's `CreateOrderRequest` interface
- Remove `upgrade` from `useRazorpayCheckout.ts` orderType union (upgrades go through `razorpay-upgrade-subscription`)

---

## Phase 2: HIGH Priority Fixes

### H5. Move admin operations to server-side RPCs
- `admin_get_users` and `admin_adjust_credits` RPCs already exist (confirmed in DB functions)
- Admin coupon operations (create, toggle, delete) still use direct table queries — create RPCs: `admin_create_coupon(...)`, `admin_toggle_coupon(p_coupon_id, p_active)`, `admin_delete_coupon(p_coupon_id)`, each verifying `has_role(auth.uid(), 'admin')`
- Update `AdminCouponsPage.tsx` to call these RPCs

### H8. Orphaned audit watchdog
- The `auto_settle_stale_sessions()` function already exists and handles stale audits (refunds credits, marks as failed). It uses a 12-hour threshold
- Reduce the threshold to 30 minutes and ensure it's scheduled via pg_cron every 15 minutes (or verify existing schedule)

### H9. Fix N+1 query pattern
- `useFindingComments.ts`: Already collects `userIds` but then loops per comment. Refactor to single `.in('user_id', userIds)` batch query, then build a Map
- `useRemediationProgress.ts`: Same fix — batch fetch profiles by `changed_by` IDs

---

## Phase 3: MEDIUM Priority Fixes

### M4. Stale order cleanup
- Create a DB function `expire_stale_orders()` that updates `payment_orders` where `status = 'pending' AND created_at < now() - interval '2 hours'` to `status = 'expired'`
- Schedule via pg_cron hourly

### M5. Fix webhook `payment.failed` lookup
- Add fallback lookups in `razorpay-webhook/index.ts`: check `entity.payment_link_id` matching `rz_payment_link_id`, then `entity.notes?.reference_id` matching `order_id`

### M6. Subscription expiry enforcement
- The `expire_overdue_subscriptions()` function already exists. Verify it's scheduled via pg_cron daily. If not, add the cron job

### M11. Fix SharingPage report links
- Change `/report/${share.audit_id}` to `/dashboard/reports/${share.audit_id}` in `SharingPage.tsx`

### M12. Fix GitHub OAuth redirect URL
- Replace all `/settings?tab=integrations` references with `/dashboard/integrations` in `GitHubIntegration.tsx`

### M13. Enforce webhook idempotency when event ID is absent
- If `eventId` is null/empty, generate a deterministic fallback ID from the payload or reject with 400

### M14. Admin coupon delete confirmation
- Wrap delete action in `AlertDialog` confirmation dialog showing the coupon code

---

## Phase 4: LOW Priority Fixes

### L7. Password min length to 8
- Change `z.string().min(6, ...)` to `z.string().min(8, 'Password must be at least 8 characters')` in `Auth.tsx`

### L9. Gate console.log behind dev check
- Wrap production `console.log`/`console.error` in payment hooks with `if (import.meta.env.DEV)` checks

### L11. PaymentSuccess navigates to legacy route
- Change `/audits` to `/dashboard` in `PaymentSuccess.tsx`

### L12. AdminRoute loading spinner
- Replace `return null` with a centered `Loader2` spinner in `AdminRoute.tsx`

### L13. Standardize on sonner toasts
- Migrate `useToast()` calls to sonner `toast.success()`/`toast.error()` across all files (this is a larger refactor, can be done incrementally)

### L14. Admin audit detail 404 state
- Add "Audit not found" card with back button in `AdminAuditDetailPage.tsx`

### L15. Admin users pagination — append instead of replace
- Use state accumulation or `useInfiniteQuery` in `AdminUsersPage.tsx`

### L16. Shared `useProfile` hook
- Create a reusable `useProfile(userId)` hook with React Query caching

### L17. Add explicit user_id filter to credit_txns
- Add `.eq('user_id', user.id)` to `useCreditActivity.ts` query

### L18. Reduce admin role staleTime
- Change `staleTime: 5 * 60 * 1000` to `staleTime: 60_000` in `useAdminRole.ts`

### L19. Remove stale env var
- Remove `VITE_CASHFREE_MODE` from `.env` (note: .env is auto-managed, may need manual removal)

### L21. Fix `FRONTEND_URL` fallback
- Change fallback from `https://solarizer-app.lovable.app` to `https://solarizer.io` in `razorpay-create-order/index.ts`

---

## Phase 5: Dead Code Cleanup

### Delete unused pages
- Delete `src/pages/Index.tsx`, `src/pages/Settings.tsx`, `src/pages/SubscriptionSuccess.tsx`

### Delete unused Supabase functions
- Delete `supabase/functions/razorpay-callback/` directory
- Remove `verifyOrderSignature` from `_shared/razorpaySignature.ts` (keep the other two exports)
- Keep `_shared/razorpayAuth.ts` — verify if actually unused before deleting

### Clean up config.toml
- Remove `[functions.razorpay-create-subscription]`, `[functions.razorpay-cancel-subscription]`, and the duplicate `[functions.razorpay-create-order]` entry

### Database cleanup migration
- Check if `cf_subscription_id`/`cf_plan_id` columns exist on `subscriptions` (search found no references — they may already be dropped)
- Drop unused functions if they exist: `activate_subscription`, `process_subscription_renewal`, `process_upgrade_success`, `handle_subscription_payment_failed`

---

## Technical Summary

| Category | Migrations | Edge Function Deploys | Frontend Files |
|----------|-----------|----------------------|----------------|
| CRITICAL | 3 (C1 RPC, C2 RLS, C3 drop) | 1 (C4 razorpay-create-order) | 3 |
| HIGH | 1 (H5 admin RPCs) | 0 | 3 |
| MEDIUM | 2 (M4, M6 cron jobs) | 2 (M5, M13 webhook) | 3 |
| LOW | 0 | 1 (L21 fallback URL) | ~10 |
| Cleanup | 1 (drop dead functions) | 1 (delete razorpay-callback) | 3 deleted |

Given the scope, I recommend implementing in the phase order above (CRITICAL first), with each phase as a separate approval step. Shall I proceed with Phase 1 (CRITICAL fixes) first?

